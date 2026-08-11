/**
 * 01 - 问题路由
 * 解决“简单问题不应浪费检索资源”的问题，适合学习 addConditionalEdges。
 * 相比 00 新增 simple/complex 分支，并把 Milvus 连接推迟到检索节点。
 * 局限与依赖：路由仍需模型 API；complex 分支还需要 embedding API 和 Milvus。
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  BOOK_TITLE,
  TOP_K,
  formatContext,
  getQuestion,
  isMain,
  llm,
  printDocuments,
  printGraph,
  printQuestion,
  retrieveDocuments,
  streamAnswer,
} from "./_shared/runtime.mjs";
import {
  createDirectAnswerPrompt,
  createRagAnswerPrompt,
} from "./_shared/prompts.mjs";
import { RouteSchema } from "./_shared/schemas.mjs";

const GraphState = Annotation.Root({
  question: Annotation,
  k: Annotation,
  strategy: Annotation,
  routeReason: Annotation,
  documents: Annotation,
  generation: Annotation,
});

async function routeQuestionNode(state) {
  console.log("---ROUTE_QUESTION---");
  const router = llm.withStructuredOutput(RouteSchema);
  const route =
    await router.invoke(`你是问答路由器，请判断问题是否需要检索小说知识库。

- simple：常识、简短定义，不依赖特定小说细节。
- complex：需要《${BOOK_TITLE}》的情节、人物关系、原文细节或证据。

问题：${state.question}`);
  console.log(`路由：${route.strategy}（${route.reason}）`);
  return { strategy: route.strategy, routeReason: route.reason };
}

async function directAnswerNode(state) {
  console.log("---DIRECT_ANSWER---");
  const generation = await streamAnswer(
    createDirectAnswerPrompt(state.question),
  );
  return { documents: [], generation };
}

async function retrieveNode(state) {
  console.log("---RETRIEVE---");
  const documents = await retrieveDocuments(state.question, state.k);
  return { documents };
}

async function ragGenerateNode(state) {
  console.log("---RAG_GENERATE---");
  const context = formatContext(state.documents);
  const generation = await streamAnswer(
    createRagAnswerPrompt(state.question, context),
  );
  return { generation };
}

function afterRoute(state) {
  return state.strategy === "simple" ? "direct_answer" : "retrieve";
}

export const graph = new StateGraph(GraphState)
  .addNode("route_question", routeQuestionNode)
  .addNode("direct_answer", directAnswerNode)
  .addNode("retrieve", retrieveNode)
  .addNode("rag_generate", ragGenerateNode)
  .addEdge(START, "route_question")
  .addConditionalEdges("route_question", afterRoute, {
    direct_answer: "direct_answer",
    retrieve: "retrieve",
  })
  .addEdge("retrieve", "rag_generate")
  .addEdge("direct_answer", END)
  .addEdge("rag_generate", END)
  .compile();

async function main() {
  const question = getQuestion("哈利第一次见到海格时发生了什么？");
  await printGraph(graph);
  printQuestion(question);

  const result = await graph.invoke({
    question,
    k: TOP_K,
    strategy: "",
    routeReason: "",
    documents: [],
    generation: "",
  });

  if (result.strategy === "complex") printDocuments(result.documents);
  console.log(`\n最终策略：${result.strategy}（${result.routeReason}）`);
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error("运行失败：", error.message);
    process.exitCode = 1;
  });
}
