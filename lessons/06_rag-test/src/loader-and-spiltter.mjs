import "@lessons/shared/env-loader";
import { createChatModel, createEmbeddings } from "@lessons/shared/model";
import "cheerio";
// ChatOpenAI 负责思考，OpenAIEmbeddings 负责将文字转为数学向量
// Splitter 负责将长文档切分为短块，避免超出 AI 的上下文限制
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// 向量存储库，用于存放切分后的文档向量
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
// Loader 负责从不同数据源（网页、文件、视频）加载内容并转换为 Document 对象
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

/**
 * 【本节核心知识点】
 * 1. Loader (加载器): 
 * - 解决“数据从哪来”的问题。
 * - 目前社区（@langchain/community）维护了 180+ Loader，支持 Word、PDF、网页、YouTube、推文等。
 * - 无论来源是什么，Loader 最终都会将其统一转换为标准化的 Document 对象。
 * * 2. Splitter (分割器):
 * - 解决“文档太大”的问题。
 * - 模型处理 Token 有上限，且检索细粒度的片段准确率更高。
 * - Splitter (@langchain/textsplitters) 将大 Document 切成小 Document。
 * * 3. RAG 全流程演练:
 * - Load (加载) -> Split (分割) -> Embed (向量化) -> Store (存储) -> Retrieve (检索) -> Generate (生成)
 */

// 1. 初始化 Chat 模型（deepai 代理）
const model = createChatModel();

// 2. 初始化 Embedding 模型（DashScope，与 Chat 分开配置）
const embeddings = createEmbeddings();

// 3. 【加载阶段 - Load】
// 使用 Cheerio 加载指定的网页 URL，并通过 selector 过滤出主要内容区域的段落
const cheerioLoader = new CheerioWebBaseLoader(
  "https://juejin.cn/post/7542379658521690139",
  {
    selector: ".main-area p", // 只抓取正文中的 p 标签内容
  },
);

const documents = await cheerioLoader.load();
console.assert(documents.length === 1);
console.log(`原始文档加载成功，总字符数: ${documents[0].pageContent.length}`);

// 4. 【分割阶段 - Split】
// 加载后的文档可能非常长，需要通过 Splitter 进行切分
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,     // 每个分块的最大字符数
  chunkOverlap: 50,    // 块与块之间的重叠，保证语义不因切断而丢失
  separators: ["。", "！", "？"], // 优先按句号等结束符分割
});

const splitDocuments = await textSplitter.splitDocuments(documents);
console.log(`文档分割完成，共生成 ${splitDocuments.length} 个分块\n`);

// 5. 【存储阶段 - Store】
// 将分割后的短文档传入向量存储，系统会自动调用 embeddings 将文字转为数学向量
console.log("正在创建向量存储...");
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocuments,
  embeddings,
);
console.log("向量存储创建完成\n");

// 6. 【检索与生成阶段 - Retrieval & Generation】
const retriever = vectorStore.asRetriever({ k: 2 }); // 设置检索器，每次找最相关的 2 个片段
const questions = ["作者在文章中有提及前端需要掌握多少 Node.js 知识吗？"];

for (const question of questions) {
  console.log("=".repeat(80));
  console.log(`问题: ${question}`);
  console.log("=".repeat(80));

  // A. 检索：根据问题寻找相关文档片段
  const retrievedDocs = await retriever.invoke(question);

  // B. 相似度计算（可选）：为了演示，手动计算并展示相似度分数
  const scoredResults = await vectorStore.similaritySearchWithScore(question, 2);

  console.log("\n【检索到的文档及相似度评分】");
  retrievedDocs.forEach((doc, i) => {
    const scoredResult = scoredResults.find(
      ([scoredDoc]) => scoredDoc.pageContent === doc.pageContent,
    );
    const score = scoredResult ? scoredResult[1] : null;
    // 向量距离越小相似度越高，这里用 1-score 转换以便直观理解
    const similarity = score !== null ? (1 - score).toFixed(4) : "N/A";
    
    console.log(`\n[文档 ${i + 1}] 相似度: ${similarity}`);
    console.log(`内容: ${doc.pageContent}`);
  });

  // C. 注入上下文：将检索到的片段拼接进 Prompt
  const context = retrievedDocs
    .map((doc, i) => `[片段${i + 1}]\n${doc.pageContent}`)
    .join("\n\n━━━━━\n\n");

  const prompt = `你是一个文章辅助阅读助手，请根据提供的文章片段来精准回答问题。

文章内容：
${context}

问题: ${question}

你的回答:`;

  // D. 生成：由 AI 结合上下文给出答案
  console.log("\n【AI 回答】");
  const response = await model.invoke(prompt);
  console.log(response.content);
  console.log("\n");
}

/* 
  总结：使用 CheerioWebBaseLoader 加载网页，
  RecursiveCharacterTextSplitter 分割文档，
  MemoryVectorStore 存储文档，
  asRetriever 查询文档，
  model.invoke 生成答案。

 检索时候调用了两次检索，vectorStore.similaritySearchWithScore 返回了 pageContent 和评分，为什么还需要 retriever.invoke(question)？

  答案是：retriever.invoke(question) 返回了 pageContent 和评分，而 vectorStore.similaritySearchWithScore 也是一样的作用，二者选其一即可。
 */


