import "@lessons/shared/env-loader";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { createChatModel, createEmbeddings } from "@lessons/shared/model";
import { MILVUS_COLLECTION, MILVUS_URI } from "../_shared/rag-config.mjs";

// 复习重点：文章里的 RAG Agent 只有两个 LangGraph 节点：
// retrieve 负责从 Milvus 召回上下文，generate 负责让模型只基于上下文回答。
const embeddings = createEmbeddings();

const llm = createChatModel();

const vectorStore = await Milvus.fromExistingCollection(embeddings, {
  collectionName: MILVUS_COLLECTION,
  url: MILVUS_URI,
});

const retriever = vectorStore.asRetriever({ k: 4 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是客服助手。仅根据下面「上下文」回答；上下文没有的信息请明确说不知道，不要编造。\n\n上下文：\n{context}",
  ],
  ["human", "{question}"],
]);

const chain = prompt.pipe(llm).pipe(new StringOutputParser());

const GraphState = Annotation.Root({
  question: Annotation,
  context: Annotation,
  answer: Annotation,
});

async function retrieve(state) {
  const docs = await retriever.invoke(state.question);
  return { context: docs };
}

async function generate(state) {
  const contextText = state.context.map((d) => d.pageContent).join("\n\n");
  const answer = await chain.invoke({
    context: contextText,
    question: state.question,
  });
  return { answer };
}

const workflow = new StateGraph(GraphState)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END);

export const ragApp = workflow.compile();

export async function ask(question) {
  const result = await ragApp.invoke({ question });
  return {
    answer: result.answer,
    context: result.context ?? [],
  };
}
