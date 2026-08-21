import { HumanMessage } from '@langchain/core/messages'
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph'
import { StateGraph, END, START } from '@langchain/langgraph'
import { createChatModel } from '@lessons/shared/model'
import { readEsAgentEnv } from './_shared/env.mjs'

// 这个示例对应文章里“把 Neo4j 图查询接进 LangGraph 工作流”的最终入口。
// 适合复习：问题解析 -> Cypher 生成 -> 图查询 -> 基于图结果回答。
// 依赖条件：根 .env 需要提供和 Lesson 27 一致的 ESAGENT_* 配置，本地 Neo4j Bolt 服务需要可连接；本轮只做静态整理。

function toPlainText(content) {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') {
          return item
        }

        if (typeof item?.text === 'string') {
          return item.text
        }

        return JSON.stringify(item)
      })
      .join('\n')
  }

  return String(content ?? '')
}

// ----------------------
// 连接 Neo4j 知识图谱
// ----------------------
const graph = new Neo4jGraph({
  url: 'bolt://localhost:7687',
  username: 'neo4j',
  password: '12345678',
})

// ----------------------
// 大模型
// ----------------------
const { apiKey, baseUrl, modelName } = readEsAgentEnv([
  'apiKey',
  'baseUrl',
  'modelName',
])

const llm = createChatModel({
  modelName,
  apiKey,
  temperature: 0,
  configuration: { baseURL: baseUrl },
})

// ----------------------
// 定义状态
// ----------------------
const graphState = {
  messages: {
    value: (left, right) =>
      left.concat(Array.isArray(right) ? right : [right]),
    default: () => [],
  },
  query: null,
  cypher: null,
  context: null,
  answer: null,
}

// ----------------------
// 步骤1：解析问题
// ----------------------
async function parseQuestion(state) {
  const lastMessage = state.messages[state.messages.length - 1]

  return { query: toPlainText(lastMessage.content) }
}

// ----------------------
// 步骤2：生成 Cypher
// ----------------------
async function generateCypher(state) {
  const prompt = `
      你是一个专业的 Neo4j Cypher 生成器。
      严格按照下面的结构生成正确语句，只返回纯 Cypher 代码，不要任何解释、不要 markdown 代码块。

      节点：
      - Product: 奶茶产品
      - Ingredient: 配料
      - Type: 奶茶类型
      - Method: 制作工艺
      - People: 适合人群

      关系方向（必须严格遵守）：
      - (Product)-[:属于]->(Type)
      - (Product)-[:包含]->(Ingredient)
      - (Product)-[:适合]->(People)
      - (Ingredient)-[:使用]->(Method)

      规则：
      1. 关系方向绝对不能反
      2. 多跳查询请使用多个 MATCH，不要连错路径
      3. 只返回最终可运行的 Cypher 语句

      用户问题：${state.query}
    `
  const res = await llm.invoke([new HumanMessage(prompt)])

  return { cypher: toPlainText(res.content).trim() }
}

// ----------------------
// 步骤3：执行图查询
// ----------------------
async function executeGraphQuery(state) {
  try {
    const res = await graph.query(state.cypher)

    return { context: JSON.stringify(res) }
  } catch (e) {
    return { context: '未查询到相关知识' }
  }
}

// ----------------------
// 步骤4：生成答案
// ----------------------
async function generateAnswer(state) {
  const prompt = `
    你是奶茶专家，根据下方「检索结果」回答用户问题；检索结果为空或不足时简要说明无法从图谱得到答案，不要编造。
    回答要求：
    - 直接列出事实，不要推断图谱里未出现的配料（如水、冰、添加剂等）。

    检索结果：${state.context}
    用户问题：${state.query}
  `
  const res = await llm.invoke([new HumanMessage(prompt)])

  return { answer: toPlainText(res.content).trim() }
}

// ----------------------
// 构建 LangGraph 工作流
// ----------------------
const workflow = new StateGraph({ channels: graphState })
  .addNode('parse', parseQuestion)
  .addNode('generateCypher', generateCypher)
  .addNode('executeGraph', executeGraphQuery)
  .addNode('generateAnswer', generateAnswer)
  .addEdge(START, 'parse')
  .addEdge('parse', 'generateCypher')
  .addEdge('generateCypher', 'executeGraph')
  .addEdge('executeGraph', 'generateAnswer')
  .addEdge('generateAnswer', END)

const app = workflow.compile()

async function printWorkflowMermaid() {
  const drawable = await app.getGraphAsync()
  const mermaid = drawable.drawMermaid({ withStyles: true })

  console.log('--- LangGraph 工作流 (Mermaid) ---')
  console.log(mermaid)
  console.log('-----------------------------------------------------------')
}

// ----------------------
// 运行 GraphRAG
// ----------------------
async function runGraphRAG(question) {
  const res = await app.invoke({
    messages: [new HumanMessage(question)],
  })

  console.log('======================================')
  console.log('用户问题：', question)
  console.log('生成 Cypher：', res.cypher)
  console.log('检索结果：', res.context)
  console.log('最终回答：', res.answer)
  console.log('======================================')
}

// ======================
// 测试
// ======================
;(async () => {
  await printWorkflowMermaid()
  await Promise.all([
    runGraphRAG('我们这款珍珠奶茶有哪些配料？'),
    runGraphRAG('台式奶茶的饮品都有哪些配料？'),
    runGraphRAG('珍珠奶茶适合哪些人群饮用？'),
  ])
})().catch(console.error)
