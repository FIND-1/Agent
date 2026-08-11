/**
 * 03 - 检索评估与 Web 回退
 * 解决本地知识库覆盖不足的问题，适合学习结构化评估和数据源切换。
 * 相比 02 不再继续拆分问题，而是评估证据，不足时切换到博查 Web Search。
 * 局限与依赖：需要模型、embedding、Milvus、BOCHA_API_KEY 和网络；最多联网一次。
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  BOOK_TITLE,
  TOP_K,
  getQuestion,
  isMain,
  llm,
  parseEvaluation,
  printGraph,
  printQuestion,
  retrieveDocuments,
  streamAnswer,
} from "./_shared/runtime.mjs";
import { createDirectAnswerPrompt } from "./_shared/prompts.mjs";
import { EvaluationSchema, RouteSchema } from "./_shared/schemas.mjs";

const GraphState = Annotation.Root({
  question: Annotation,
  k: Annotation,
  strategy: Annotation,
  routeReason: Annotation,
  retrievedDocuments: Annotation,
  localContext: Annotation,
  webContext: Annotation,
  evaluation: Annotation,
  generation: Annotation,
});

async function routeQuestionNode(state) {
  console.log("---ROUTE_QUESTION---");
  const router = llm.withStructuredOutput(RouteSchema);
  const route = await router.invoke(`判断问题是否需要外部资料。
- simple：常识或定义，可以直接回答。
- complex：需要《${BOOK_TITLE}》细节、实时信息、影视资料或来源链接。
问题：${state.question}`);
  console.log(`路由：${route.strategy}（${route.reason}）`);
  return { strategy: route.strategy, routeReason: route.reason };
}

async function directAnswerNode(state) {
  console.log("---DIRECT_ANSWER---");
  const generation = await streamAnswer(
    createDirectAnswerPrompt(state.question),
  );
  return { generation };
}

async function localRetrieveNode(state) {
  console.log("---LOCAL_RETRIEVE---");
  const retrievedDocuments = await retrieveDocuments(state.question, state.k);
  const localContext = retrievedDocuments
    .map(
      (document, index) =>
        `[小说片段 ${index + 1}，第 ${document.chapter} 章]\n${document.content}`,
    )
    .join("\n\n");
  console.log(`本地检索命中：${retrievedDocuments.length} 条`);
  return { retrievedDocuments, localContext };
}

async function evaluateNode(state) {
  const hasWebContext = Boolean(state.webContext?.trim());
  console.log(
    hasWebContext ? "---EVALUATE_WITH_WEB---" : "---EVALUATE_LOCAL---",
  );
  const evaluator = llm.withStructuredOutput(EvaluationSchema);
  const result = await evaluator.invoke(`你是信息充分性评估器。
判断当前资料能否完整、可核对地回答问题。

问题：${state.question}

本地小说资料：
${state.localContext || "（空）"}

联网资料：
${state.webContext || "（尚未搜索）"}

如果资料不足，请列出缺失点。尚未联网时，同时生成一个完整、无代词的 webQuery。`);

  console.log(`充分性：${result.enough}（${result.reason}）`);
  result.missing.forEach((item, index) =>
    console.log(`  缺失 ${index + 1}：${item}`),
  );
  return { evaluation: JSON.stringify(result) };
}

async function bochaWebSearch(query, count = 8) {
  const apiKey = process.env.BOCHA_API_KEY;
  if (!apiKey) throw new Error("缺少环境变量 BOCHA_API_KEY，无法执行 Web 回退");

  const response = await fetch("https://api.bochaai.com/v1/web-search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, freshness: "noLimit", summary: true, count }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`博查搜索失败：HTTP ${response.status} ${details}`);
  }

  const payload = await response.json();
  if (payload?.code !== 200 || !payload?.data) {
    throw new Error(`博查搜索失败：${payload?.msg ?? "未知错误"}`);
  }

  const pages = payload.data.webPages?.value ?? [];
  if (pages.length === 0) return "未找到相关网页。";

  return pages
    .map(
      (page, index) => `[网页 ${index + 1}]
标题：${page.name}
URL：${page.url}
摘要：${page.summary || page.snippet || "（无摘要）"}
来源：${page.siteName || "未知"}
抓取时间：${page.dateLastCrawled || "未知"}`,
    )
    .join("\n\n");
}

async function webSearchNode(state) {
  console.log("---WEB_SEARCH---");
  const evaluation = parseEvaluation(state.evaluation);
  const query = evaluation.webQuery?.trim() || state.question;
  console.log(`联网查询：${query}`);
  const webContext = await bochaWebSearch(query);
  console.log(`联网结果长度：${webContext.length}`);
  return { webContext };
}

async function generateNode(state) {
  console.log("---GENERATE---");
  const evaluation = parseEvaluation(state.evaluation);
  const generation = await streamAnswer(`你是严谨的中文问答助手。
优先依据给定资料，禁止编造。资料仍不足时，明确说明无法确认的部分。
凡使用网页资料的事实，请附上对应 URL。

本地小说资料：
${state.localContext || "（空）"}

联网资料：
${state.webContext || "（未使用）"}

评估结论：${evaluation.reason || "无"}
问题：${state.question}

回答：`);
  return { generation };
}

function afterRoute(state) {
  return state.strategy === "simple" ? "direct_answer" : "local_retrieve";
}

function afterEvaluation(state) {
  if (state.webContext?.trim()) return "generate";
  return parseEvaluation(state.evaluation).enough === true
    ? "generate"
    : "web_search";
}

export const graph = new StateGraph(GraphState)
  .addNode("route_question", routeQuestionNode)
  .addNode("direct_answer", directAnswerNode)
  .addNode("local_retrieve", localRetrieveNode)
  .addNode("evaluate", evaluateNode)
  .addNode("web_search", webSearchNode)
  .addNode("generate", generateNode)
  .addEdge(START, "route_question")
  .addConditionalEdges("route_question", afterRoute, {
    direct_answer: "direct_answer",
    local_retrieve: "local_retrieve",
  })
  .addEdge("local_retrieve", "evaluate")
  .addConditionalEdges("evaluate", afterEvaluation, {
    generate: "generate",
    web_search: "web_search",
  })
  .addEdge("web_search", "evaluate")
  .addEdge("direct_answer", END)
  .addEdge("generate", END)
  .compile();

async function main() {
  const question = getQuestion(
    "《哈利波特与魔法石》中魔法石最后如何处理？另外，2001 年电影版由谁执导？请给出可核对的来源链接。",
  );
  await printGraph(graph);
  printQuestion(question);

  const result = await graph.invoke({
    question,
    k: TOP_K,
    strategy: "",
    routeReason: "",
    retrievedDocuments: [],
    localContext: "",
    webContext: "",
    evaluation: "",
    generation: "",
  });

  console.log(`\n最终策略：${result.strategy}（${result.routeReason}）`);
  if (!result.generation?.trim()) console.log("模型未返回内容。");
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error("运行失败：", error.message);
    process.exitCode = 1;
  });
}
