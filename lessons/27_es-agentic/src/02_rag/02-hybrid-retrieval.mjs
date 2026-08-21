/**
 * 完整链路：Query 改写 → ES/Milvus 并行多路召回 → 按业务 ID 去重 → Rerank → LLM 作答。
 * 这是文章的最终组合示例，需要先运行同目录 00，并依赖 ES、IK、Milvus 与三个远程模型能力。
 */
import { Client } from "@elastic/elasticsearch";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  ES_NODE,
  HYBRID_INDEX_NAME,
  MILVUS_ADDRESS,
  MILVUS_TEXT_FIELD,
  MILVUS_VECTOR_FIELD,
} from "../_shared/constants.mjs";
import { DashScopeRerank } from "../_shared/dashscope-rerank.mjs";
import { readEsAgentEnv } from "../_shared/env.mjs";
import {
  augmentQuery,
  retrievalQueryStrings,
} from "../_shared/query-augment.mjs";

const HybridRetrievalState = Annotation.Root({
  query: Annotation(),
  queryAugmentation: Annotation(),
  esHits: Annotation(),
  milvusHits: Annotation(),
  merged: Annotation(),
  topDocuments: Annotation(),
  answer: Annotation(),
});

function documentFromEsHit(hit) {
  const source = hit._source ?? {};
  return new Document({
    pageContent: [source.note_title, source.note_body]
      .filter(Boolean)
      .join("\n"),
    metadata: { ...source, id: hit._id, source: "es" },
  });
}

/** 两路结果使用 seed 阶段写入的同一业务 ID 去重，并保留第一次出现的文档。 */
function dedupeDocumentsById(documents) {
  const seen = new Set();
  const output = [];

  for (const document of documents ?? []) {
    const id = String(document?.metadata?.id ?? "").trim();
    if (!document?.pageContent || !id || seen.has(id)) continue;
    seen.add(id);
    output.push(document);
  }

  return output;
}

function messageContentToString(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
  return content
    .map((part) =>
      typeof part === "string"
        ? part
        : typeof part?.text === "string"
          ? part.text
          : "",
    )
    .join("");
}

function formatContext(documents) {
  return documents
    .map((document, index) => {
      const { id = "", source = "" } = document.metadata ?? {};
      return `[${index + 1}] id=${id} source=${source}\n${document.pageContent}`;
    })
    .join("\n\n---\n\n");
}

const ANSWER_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是阅读用户「生活笔记」知识库并作答的助手。
- 只根据检索片段回答，片段中没有的信息不要编造。
- 片段不足时明确说明「笔记里未提到」。
- 回答保持简洁、有条理。`,
  ],
  ["human", "用户问题：{query}\n\n检索片段：\n{context}"],
]);

const NO_CONTEXT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    "当前没有检索到生活笔记片段。请简短说明无法回答，并建议用户补充关键词。",
  ],
  ["human", "用户问题：{query}"],
]);

export function compileHybridRetrievalGraph(
  esClient,
  milvus,
  reranker,
  chatModel,
) {
  const totalRecall = 15;

  return new StateGraph(HybridRetrievalState)
    .addNode("query_augment", async (state) => ({
      queryAugmentation: await augmentQuery(chatModel, state.query ?? ""),
    }))
    .addNode("es_recall", async (state) => {
      const queries = retrievalQueryStrings(
        state.query,
        state.queryAugmentation,
      );
      const size = Math.max(2, Math.ceil(totalRecall / queries.length));
      const batches = await Promise.all(
        queries.map((query) =>
          esClient.search({
            index: HYBRID_INDEX_NAME,
            size,
            query: {
              multi_match: {
                query,
                fields: ["note_title^2", "note_body"],
                type: "best_fields",
                analyzer: "ik_smart",
              },
            },
          }),
        ),
      );
      return {
        esHits: dedupeDocumentsById(
          batches.flatMap((batch) => batch.hits.hits.map(documentFromEsHit)),
        ),
      };
    })
    .addNode("milvus_recall", async (state) => {
      const queries = retrievalQueryStrings(
        state.query,
        state.queryAugmentation,
      );
      const size = Math.max(2, Math.ceil(totalRecall / queries.length));
      const batches = await Promise.all(
        queries.map((query) => milvus.similaritySearch(query, size)),
      );
      return { milvusHits: dedupeDocumentsById(batches.flat()) };
    })
    .addNode("merge", async (state) => ({
      merged: dedupeDocumentsById([
        ...(state.esHits ?? []),
        ...(state.milvusHits ?? []),
      ]),
    }))
    .addNode("rerank", async (state) => ({
      topDocuments: state.merged?.length
        ? await reranker.compressDocuments(state.merged, state.query)
        : [],
    }))
    .addNode("generate_answer", async (state) => {
      const prompt = state.topDocuments?.length
        ? ANSWER_PROMPT
        : NO_CONTEXT_PROMPT;
      const message = await prompt.pipe(chatModel).invoke({
        query: state.query ?? "",
        context: formatContext(state.topDocuments ?? []),
      });
      return { answer: messageContentToString(message.content).trim() };
    })
    .addEdge(START, "query_augment")
    .addEdge("query_augment", "es_recall")
    .addEdge("query_augment", "milvus_recall")
    .addEdge(["es_recall", "milvus_recall"], "merge")
    .addEdge("merge", "rerank")
    .addEdge("rerank", "generate_answer")
    .addEdge("generate_answer", END)
    .compile();
}

const { apiKey, baseUrl, rerankUrl, modelName, rerankModel } = readEsAgentEnv([
  "apiKey",
  "baseUrl",
  "rerankUrl",
  "modelName",
  "rerankModel",
]);
const esClient = new Client({ node: ES_NODE });
const embeddings = new OpenAIEmbeddings({
  apiKey,
  model: "text-embedding-v3",
  configuration: { baseURL: baseUrl },
});
const milvus = await Milvus.fromExistingCollection(embeddings, {
  url: `http://${MILVUS_ADDRESS}`,
  collectionName: HYBRID_INDEX_NAME,
  textField: MILVUS_TEXT_FIELD,
  vectorField: MILVUS_VECTOR_FIELD,
});
const reranker = new DashScopeRerank({
  apiKey,
  model: rerankModel,
  topN: 3,
  baseUrl: rerankUrl,
});
const chatModel = new ChatOpenAI({
  apiKey,
  model: modelName,
  temperature: 0.2,
  configuration: { baseURL: baseUrl },
});
const graph = compileHybridRetrievalGraph(
  esClient,
  milvus,
  reranker,
  chatModel,
);

console.log((await graph.getGraphAsync()).drawMermaid());

const result = await graph.invoke({
  query: "雨天回家后，玄关怎样保持干燥？",
});
console.log("\n查询改写：", result.queryAugmentation.queries);
console.log("ES 召回：", result.esHits.length);
console.log("Milvus 召回：", result.milvusHits.length);
console.log("合并去重：", result.merged.length);
console.log("Rerank 保留：", result.topDocuments.length);
console.log("\n最终回答：\n", result.answer);
