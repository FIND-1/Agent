import "@lessons/shared/env-loader";
import { createChatModel, createEmbeddings } from "@lessons/shared/model";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { pathToFileURL } from "node:url";

export const BOOK_TITLE = "哈利波特与魔法石";
export const BOOK_ID = "harry_potter_and_philosophers_stone";
export const COLLECTION_NAME = "ebook_collection";
export const VECTOR_DIM = 1024;
export const TOP_K = 5;

// 跨示例只保留一份模型与 embedding 初始化；示例文件专注于各自的图结构。
export const llm = createChatModel({ temperature: 0 });

const embeddings = createEmbeddings({ dimensions: VECTOR_DIM });
let vectorStorePromise;

/** 延迟连接：只有真正进入检索节点时才连接 Milvus。 */
export async function getVectorStore() {
  if (!vectorStorePromise) {
    vectorStorePromise = connectVectorStore().catch((error) => {
      vectorStorePromise = undefined;
      throw error;
    });
  }
  return vectorStorePromise;
}

async function connectVectorStore() {
  const address = process.env.MILVUS_ADDRESS ?? "localhost:19530";
  console.log(`连接到 Milvus（${address}）...`);

  const store = await Milvus.fromExistingCollection(embeddings, {
    collectionName: COLLECTION_NAME,
    url: address,
    textField: "content",
    primaryField: "id",
    vectorField: "vector",
    indexCreateOptions: {
      metric_type: "COSINE",
      index_type: "IVF_FLAT",
      params: { nlist: 1024 },
      search_params: { nprobe: 16 },
    },
  });
  store.indexSearchParams = {
    metric_type: "COSINE",
    params: JSON.stringify({ nprobe: 16 }),
  };

  try {
    await store.client.loadCollection({ collection_name: COLLECTION_NAME });
  } catch (error) {
    if (!error.message.includes("already loaded")) throw error;
  }

  console.log(`✓ 集合 ${COLLECTION_NAME} 已加载\n`);
  return store;
}

/** 只检索 lesson 09 写入的《哈利波特与魔法石》数据。 */
export async function retrieveDocuments(query, k = TOP_K) {
  const store = await getVectorStore();
  const filter = `book_id == "${BOOK_ID}"`;
  const docsWithScores = await store.similaritySearchWithScore(
    query,
    k,
    filter,
  );

  return docsWithScores.map(([doc, score]) => ({
    score,
    content: doc.pageContent,
    id: doc.metadata?.id ?? "unknown",
    bookId: doc.metadata?.book_id ?? BOOK_ID,
    bookName: doc.metadata?.book_name ?? BOOK_TITLE,
    chapter: doc.metadata?.chapter_num ?? "未知",
    chunkIndex: doc.metadata?.index ?? "未知",
  }));
}

export function mergeDocuments(existing = [], incoming = []) {
  const byId = new Map();
  for (const document of [...existing, ...incoming]) {
    const previous = byId.get(String(document.id));
    if (!previous || Number(document.score) > Number(previous.score)) {
      byId.set(String(document.id), document);
    }
  }
  return [...byId.values()].sort((a, b) => Number(b.score) - Number(a.score));
}

export function formatContext(documents = []) {
  return documents
    .map(
      (document, index) => `[片段 ${index + 1}]
书籍：${document.bookName}
章节：第 ${document.chapter} 章
内容：${document.content}`,
    )
    .join("\n\n-----\n\n");
}

export function printDocuments(documents = [], title = "检索结果") {
  console.log(`\n【${title}】`);
  if (documents.length === 0) {
    console.log("未找到相关内容。");
    return;
  }

  documents.forEach((document, index) => {
    const preview =
      document.content.length > 180
        ? `${document.content.slice(0, 180)}...`
        : document.content;
    console.log(
      `\n[${index + 1}] score=${Number(document.score).toFixed(4)} ` +
        `chapter=${document.chapter} chunk=${document.chunkIndex}`,
    );
    console.log(preview);
  });
}

export async function streamAnswer(prompt) {
  let answer = "";
  process.stdout.write("\n【AI 回答（流式）】\n");
  const stream = await llm.stream(prompt);
  for await (const chunk of stream) {
    const text = typeof chunk.content === "string" ? chunk.content : "";
    if (!text) continue;
    answer += text;
    process.stdout.write(text);
  }
  process.stdout.write("\n");
  return answer;
}

export async function printGraph(graph) {
  const drawable = await graph.getGraphAsync();
  console.log("【LangGraph Mermaid】");
  console.log(drawable.drawMermaid({ withStyles: true }));
}

export function getQuestion(defaultQuestion) {
  const cliQuestion = process.argv.slice(2).join(" ").trim();
  return cliQuestion || defaultQuestion;
}

export function printQuestion(question) {
  console.log("=".repeat(80));
  console.log(`问题：${question}`);
  console.log("=".repeat(80));
}

export function parseEvaluation(serialized) {
  try {
    return JSON.parse(serialized || "{}");
  } catch {
    return {};
  }
}

export function isMain(metaUrl) {
  return (
    Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href
  );
}
