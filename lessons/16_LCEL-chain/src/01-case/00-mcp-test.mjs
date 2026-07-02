import { createChatModel } from "@lessons/shared/model";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import chalk from "chalk";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import {
  RunnableBranch,
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

/**
 * 复习重点：
 * 这篇文章先把之前 tool-test 里的 MCP Agent 改造成 LCEL 写法。
 *
 * 原文分析结论：
 * - bindTools 之后的 model 是一个 Runnable
 * - Prompt Template 是一个 Runnable
 * - 调用大模型返回结果后的 if/else 逻辑，可以封装成 RunnableBranch
 * - 具体处理 tool call 的逻辑，可以封装成 RunnableLambda
 * - 最后把这些 Runnable 组装成 chain，统一 invoke
 *
 * 依赖条件：
 * - 需要模型 API 配置
 * - 需要 AMAP_MAPS_API_KEY
 * - chrome-devtools-mcp 第一次运行可能会通过 npx 下载依赖
 */

const model = createChatModel();

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "amap-maps-streamableHTTP": {
      url: `https://mcp.amap.com/mcp?key=${process.env.AMAP_MAPS_API_KEY}`,
    },
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个可以调用 MCP 工具的智能助手。"],
  new MessagesPlaceholder("messages"),
]);

const llmChain = prompt.pipe(modelWithTools);

// 1. 定义处理工具调用的逻辑，封装为 Runnable。
const toolExecutor = new RunnableLambda({
  func: async (input) => {
    const { response, tools } = input;
    const toolResults = [];

    for (const toolCall of response.tool_calls ?? []) {
      const foundTool = tools.find((tool) => tool.name === toolCall.name);
      if (!foundTool) continue;

      const toolResult = await foundTool.invoke(toolCall.args);

      // 兼容 MCP 工具可能返回字符串、text 字段或普通对象的情况。
      const contentStr =
        typeof toolResult === "string"
          ? toolResult
          : (toolResult?.text ?? JSON.stringify(toolResult));

      toolResults.push(
        new ToolMessage({
          content: contentStr,
          tool_call_id: toolCall.id,
        }),
      );
    }

    return toolResults;
  },
});

// 2. 对 LLM 结果进行处理：没有 tool_calls 就结束，有 tool_calls 就执行工具。
const agentStepChain = RunnableSequence.from([
  // step1: 将 LLM 输出挂到 state.response 上。
  RunnablePassthrough.assign({
    response: llmChain,
  }),
  // step2: 使用 RunnableBranch 根据是否有 tool_calls 走不同分支。
  RunnableBranch.from([
    // 分支1：没有 tool_calls，认为本轮已经完成。
    [
      (state) => !state.response.tool_calls || state.response.tool_calls.length === 0,
      new RunnableLambda({
        func: async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];
          return {
            ...state,
            messages: newMessages,
            done: true,
            final: response.content,
          };
        },
      }),
    ],
    // 默认分支：有 tool_calls，调用工具并把 ToolMessage 写回 messages。
    RunnableSequence.from([
      new RunnableLambda({
        func: async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];

          console.log(chalk.bgBlue(`检测到 ${response.tool_calls.length} 个工具调用`));
          console.log(
            chalk.bgBlue(`工具调用: ${response.tool_calls.map((tool) => tool.name).join(", ")}`),
          );

          return {
            ...state,
            messages: newMessages,
          };
        },
      }),
      // 调用工具执行器，得到 toolMessages。
      RunnablePassthrough.assign({
        toolMessages: toolExecutor,
      }),
      new RunnableLambda({
        func: async (state) => {
          const { messages, toolMessages } = state;
          return {
            ...state,
            messages: [...messages, ...(toolMessages ?? [])],
            done: false,
          };
        },
      }),
    ]),
  ]),
]);

async function runAgentWithTools(query, maxIterations = 10) {
  let state = {
    messages: [new HumanMessage(query)],
    done: false,
    final: null,
    tools,
  };

  for (let i = 0; i < maxIterations; i += 1) {
    console.log(chalk.bgGreen(`正在等待 AI 思考，第 ${i + 1} 轮...`));

    // 每一轮都通过一个完整的 Runnable chain：LLM + 工具调用处理。
    state = await agentStepChain.invoke(state);

    if (state.done) {
      console.log(`\nAI 最终回复:\n${state.final}\n`);
      return state.final;
    }
  }

  return state.messages[state.messages.length - 1].content;
}

try {
  // 简化查询：先验证 MCP 工具调用链路，避免一开始就触发较慢的浏览器多 tab 操作。
  await runAgentWithTools("成都南站附近最近的 3 个酒店");

  // 完整版：涉及浏览器操作，耗时较长。
  // await runAgentWithTools(
  //   "成都南站附近的酒店，最近的 3 个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个 tab 一个 url 展示，并且把那个页面标题改为酒店名",
  // );
} finally {
  await mcpClient.close();
}
