/**
 * 00 - 传统 RAG 对照组
 * 解决“如何把检索片段交给模型回答”的基础问题，适合学习普通节点和顺序边。
 * 后续示例会在此基础上加入路由、循环和评估；当前局限是每个问题都连接 Milvus。
 * 依赖：模型 API、embedding API、lesson 09 写入的 Milvus collection。
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  BOOK_TITLE,
  TOP_K,
  formatContext,
  getQuestion,
  isMain,
  printDocuments,
  printGraph,
  printQuestion,
  retrieveDocuments,
  streamAnswer,
} from "./_shared/runtime.mjs";
import { createRagAnswerPrompt } from "./_shared/prompts.mjs";

const GraphState = Annotation.Root({
  question: Annotation,
  k: Annotation,
  documents: Annotation,
  generation: Annotation,
});

async function retrieveNode(state) {
  console.log("---RETRIEVE---");
  const documents = await retrieveDocuments(state.question, state.k);
  return { documents };
}

async function generateNode(state) {
  console.log("---GENERATE---");
  if (state.documents.length === 0) {
    return {
      generation: `没有检索到《${BOOK_TITLE}》的相关内容，无法可靠回答。`,
    };
  }

  const context = formatContext(state.documents);
  const generation = await streamAnswer(
    createRagAnswerPrompt(state.question, context),
  );
  return { generation };
}

export const graph = new StateGraph(GraphState)
  .addNode("retrieve", retrieveNode)
  .addNode("generate", generateNode)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END)
  .compile();

async function main() {
  const question = getQuestion("哈利是怎样得到魔法石的？");
  await printGraph(graph);
  printQuestion(question);

  const result = await graph.invoke({
    question,
    k: TOP_K,
    documents: [],
    generation: "",
  });

  printDocuments(result.documents);
  if (!result.generation?.trim()) console.log("模型未返回内容。");
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error("运行失败：", error.message);
    process.exitCode = 1;
  });
}
