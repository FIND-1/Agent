/**
 * 04 - 无外部服务 fallback
 * 解决模型 API 或 Milvus 不可用时无法复习流程的问题，适合观察 StateGraph 的完整数据流。
 * 相比 00～03，本例用本地摘要和规则替代模型决策、向量检索，但仍保留
 * “路由 -> 选择片段 -> 评估 -> 组装 prompt”的学习链路。
 * 局限：关键词评分和固定结论只用于教学，不代表真实语义检索或模型生成效果。
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { pathToFileURL } from "node:url";

const LOCAL_DOCUMENTS = [
  {
    id: "mirror",
    keywords: ["魔法石", "厄里斯魔镜", "得到", "口袋"],
    content:
      "哈利面对厄里斯魔镜时，只想找到魔法石而不想利用它。魔法石随后出现在他的口袋里。",
  },
  {
    id: "flamel",
    keywords: ["尼可", "勒梅", "炼金术", "魔法石", "巧克力蛙"],
    content:
      "哈利最早从邓布利多的巧克力蛙画片上见过尼可·勒梅的名字，后来通过资料查到他是炼金术士。",
  },
  {
    id: "destroy",
    keywords: ["销毁", "处理", "邓布利多", "勒梅", "魔法石"],
    content: "事件结束后，邓布利多告诉哈利，尼可·勒梅已经同意销毁魔法石。",
  },
];

const GraphState = Annotation.Root({
  question: Annotation,
  strategy: Annotation,
  documents: Annotation,
  enough: Annotation,
  prompt: Annotation,
});

function routeNode(state) {
  console.log("---LOCAL_ROUTE---");
  const needsBookEvidence = /哈利|魔法石|勒梅|霍格沃茨/.test(state.question);
  return { strategy: needsBookEvidence ? "retrieve" : "direct" };
}

function localRetrieveNode(state) {
  console.log("---LOCAL_RETRIEVE---");
  const scoredDocuments = LOCAL_DOCUMENTS.map((document) => ({
    ...document,
    score: document.keywords.filter((keyword) =>
      state.question.includes(keyword),
    ).length,
  })).sort((a, b) => b.score - a.score);
  const bestScore = scoredDocuments[0]?.score ?? 0;
  const documents = scoredDocuments.filter(
    (document) => bestScore > 0 && document.score === bestScore,
  );
  return { documents };
}

function evaluateNode(state) {
  console.log("---LOCAL_EVALUATE---");
  return { enough: state.documents.length > 0 };
}

function buildRagPromptNode(state) {
  console.log("---BUILD_RAG_PROMPT---");
  const context = state.documents
    .map((document, index) => `[片段 ${index + 1}] ${document.content}`)
    .join("\n");
  return {
    prompt: `你是《哈利波特与魔法石》问答助手。请只根据片段回答。\n\n${context}\n\n问题：${state.question}\n回答：`,
  };
}

function buildDirectPromptNode(state) {
  console.log("---BUILD_DIRECT_PROMPT---");
  return { prompt: `请直接简洁回答：${state.question}` };
}

function buildInsufficientPromptNode(state) {
  console.log("---BUILD_INSUFFICIENT_PROMPT---");
  return {
    prompt: `没有找到足够的本地证据，请明确告知用户无法确认：${state.question}`,
  };
}

function afterRoute(state) {
  return state.strategy;
}

function afterEvaluation(state) {
  return state.enough ? "build_rag_prompt" : "build_insufficient_prompt";
}

export const graph = new StateGraph(GraphState)
  .addNode("route", routeNode)
  .addNode("local_retrieve", localRetrieveNode)
  .addNode("evaluate", evaluateNode)
  .addNode("build_rag_prompt", buildRagPromptNode)
  .addNode("build_direct_prompt", buildDirectPromptNode)
  .addNode("build_insufficient_prompt", buildInsufficientPromptNode)
  .addEdge(START, "route")
  .addConditionalEdges("route", afterRoute, {
    retrieve: "local_retrieve",
    direct: "build_direct_prompt",
  })
  .addEdge("local_retrieve", "evaluate")
  .addConditionalEdges("evaluate", afterEvaluation, {
    build_rag_prompt: "build_rag_prompt",
    build_insufficient_prompt: "build_insufficient_prompt",
  })
  .addEdge("build_rag_prompt", END)
  .addEdge("build_direct_prompt", END)
  .addEdge("build_insufficient_prompt", END)
  .compile();

async function main() {
  const question =
    process.argv.slice(2).join(" ").trim() || "哈利是怎样得到魔法石的？";
  const mermaid = (await graph.getGraphAsync()).drawMermaid({
    withStyles: true,
  });
  console.log("【LangGraph Mermaid】");
  console.log(mermaid);

  const result = await graph.invoke({
    question,
    strategy: "",
    documents: [],
    enough: false,
    prompt: "",
  });

  console.log(`\n问题：${question}`);
  console.log(`策略：${result.strategy}`);
  console.log(`命中片段：${result.documents.length}`);
  console.log("\n【最终组装的 Prompt】");
  console.log(result.prompt);
}

const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error("运行失败：", error.message);
    process.exitCode = 1;
  });
}
