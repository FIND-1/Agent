/**
 * 02 - 多跳检索
 * 解决单次检索难以回答链式问题的情况，适合学习条件边、回边和循环 state。
 * 相比 01 新增“拆解 -> 检索 -> 决策 -> 再检索”闭环，并设置硬性轮数上限。
 * 局限与依赖：子问题质量由模型决定，且每一跳都需要 embedding API 和 Milvus。
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  BOOK_TITLE,
  TOP_K,
  formatContext,
  getQuestion,
  isMain,
  llm,
  mergeDocuments,
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
import {
  DecomposeSchema,
  NextStepSchema,
  RouteSchema,
} from "./_shared/schemas.mjs";

const GraphState = Annotation.Root({
  question: Annotation,
  k: Annotation,
  strategy: Annotation,
  routeReason: Annotation,
  subQuestions: Annotation,
  nextSubQuestionIndex: Annotation,
  currentQuery: Annotation,
  documents: Annotation,
  retrievalCount: Annotation,
  maxRetrievals: Annotation,
  plannedNext: Annotation,
  generation: Annotation,
});

async function routeQuestionNode(state) {
  console.log("---ROUTE_QUESTION---");
  const router = llm.withStructuredOutput(RouteSchema);
  const route =
    await router.invoke(`判断问题是否需要检索《${BOOK_TITLE}》知识库。
- simple：常识或定义，可直接回答。
- complex：涉及小说事实、人物关系、因果链或多步证据。
问题：${state.question}`);
  console.log(`路由：${route.strategy}（${route.reason}）`);
  return { strategy: route.strategy, routeReason: route.reason };
}

async function decomposeQuestionNode(state) {
  console.log("---DECOMPOSE_QUESTION---");
  const decomposer = llm.withStructuredOutput(DecomposeSchema);
  const result = await decomposer.invoke(`你是《${BOOK_TITLE}》多跳检索规划器。
把原问题拆成 1～6 个按推理顺序排列、可独立检索的完整中文子问题。
禁止使用“他、她、此人、上文”等指代；不要拆成零散关键词。

原问题：${state.question}`);
  const subQuestions = result.subQuestions
    .map((item) => item.trim())
    .filter(Boolean);
  if (subQuestions.length === 0) throw new Error("没有生成可用的子问题");

  console.log(`拆解结果（${result.reason}）：`);
  subQuestions.forEach((question, index) =>
    console.log(`  ${index + 1}. ${question}`),
  );
  return {
    subQuestions,
    nextSubQuestionIndex: 0,
    currentQuery: subQuestions[0],
    documents: [],
    retrievalCount: 0,
  };
}

async function retrieveNode(state) {
  console.log(
    `---RETRIEVE ${state.retrievalCount + 1}: ${state.currentQuery}---`,
  );
  const newDocuments = await retrieveDocuments(state.currentQuery, state.k);
  return {
    documents: mergeDocuments(state.documents, newDocuments),
    retrievalCount: state.retrievalCount + 1,
    nextSubQuestionIndex: state.nextSubQuestionIndex + 1,
  };
}

async function planNextStepNode(state) {
  console.log("---PLAN_NEXT_STEP---");
  const hasNextQuestion =
    state.nextSubQuestionIndex < state.subQuestions.length;
  const reachedLimit = state.retrievalCount >= state.maxRetrievals;
  if (!hasNextQuestion || reachedLimit) {
    const reason = reachedLimit ? "达到最大检索轮数" : "所有子问题均已检索";
    console.log(`下一步：generate（${reason}）`);
    return { plannedNext: "generate" };
  }

  const planner = llm.withStructuredOutput(NextStepSchema);
  const summary = state.documents
    .slice(0, 8)
    .map((document, index) => `${index + 1}. ${document.content.slice(0, 160)}`)
    .join("\n");
  const decision = await planner.invoke(`判断现有证据是否足以回答原问题。
- 证据已完整：generate
- 仍缺关键事实：retrieve（系统会检索下一个已规划子问题）

原问题：${state.question}
现有证据：
${summary || "（空）"}`);

  const plannedNext = decision.nextAction;
  const currentQuery = state.subQuestions[state.nextSubQuestionIndex];
  console.log(`下一步：${plannedNext}（${decision.reason}）`);
  return { plannedNext, currentQuery };
}

async function directAnswerNode(state) {
  console.log("---DIRECT_ANSWER---");
  const generation = await streamAnswer(
    createDirectAnswerPrompt(state.question),
  );
  return { generation };
}

async function generateNode(state) {
  console.log("---GENERATE---");
  const generation = await streamAnswer(
    createRagAnswerPrompt(state.question, formatContext(state.documents)),
  );
  return { generation };
}

function afterRoute(state) {
  return state.strategy === "simple" ? "direct_answer" : "decompose_question";
}

function afterPlan(state) {
  return state.plannedNext;
}

export const graph = new StateGraph(GraphState)
  .addNode("route_question", routeQuestionNode)
  .addNode("direct_answer", directAnswerNode)
  .addNode("decompose_question", decomposeQuestionNode)
  .addNode("retrieve", retrieveNode)
  .addNode("plan_next_step", planNextStepNode)
  .addNode("generate", generateNode)
  .addEdge(START, "route_question")
  .addConditionalEdges("route_question", afterRoute, {
    direct_answer: "direct_answer",
    decompose_question: "decompose_question",
  })
  .addEdge("decompose_question", "retrieve")
  .addEdge("retrieve", "plan_next_step")
  .addConditionalEdges("plan_next_step", afterPlan, {
    retrieve: "retrieve",
    generate: "generate",
  })
  .addEdge("direct_answer", END)
  .addEdge("generate", END)
  .compile();

async function main() {
  const question = getQuestion(
    "哈利第一次在哪里见到尼可·勒梅这个名字，后来他和朋友们如何查明勒梅的身份？",
  );
  await printGraph(graph);
  printQuestion(question);

  const result = await graph.invoke({
    question,
    k: TOP_K,
    strategy: "",
    routeReason: "",
    subQuestions: [],
    nextSubQuestionIndex: 0,
    currentQuery: "",
    documents: [],
    retrievalCount: 0,
    maxRetrievals: 6,
    plannedNext: "",
    generation: "",
  });

  if (result.subQuestions?.length) {
    console.log("\n【子问题】");
    result.subQuestions.forEach((item, index) =>
      console.log(`${index + 1}. ${item}`),
    );
  }
  printDocuments(result.documents, "累计检索结果");
  console.log(`\n检索轮数：${result.retrievalCount} / ${result.maxRetrievals}`);
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error("运行失败：", error.message);
    process.exitCode = 1;
  });
}
