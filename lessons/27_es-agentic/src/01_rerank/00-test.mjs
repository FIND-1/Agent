/**
 * 在混合召回之前，先单独观察 Rerank 如何按“问题—文档”相关性重新排序。
 * 它不是召回器，不能补回漏掉的文档；本例需要根目录 .env 和远程 Rerank API。
 */
import { Document } from "@langchain/core/documents";
import { readEsAgentEnv } from "../_shared/env.mjs";
import { DashScopeRerank } from "../_shared/dashscope-rerank.mjs";

async function main() {
  const { apiKey, rerankUrl, rerankModel } = readEsAgentEnv([
    "apiKey",
    "rerankUrl",
    "rerankModel",
  ]);

  const compressor = new DashScopeRerank({
    apiKey,
    baseUrl: rerankUrl,
    model: rerankModel,
    topN: 3,
  });

  const query = "什么是文本排序模型";
  const docs = [
    new Document({
      pageContent: "预训练语言模型的发展给文本排序模型带来了新的进展",
    }),
    new Document({ pageContent: "量子计算是计算科学的一个前沿领域" }),
    new Document({
      pageContent: "文本排序模型广泛用于搜索引擎和推荐系统中…",
    }),
  ];

  const ranked = await compressor.compressDocuments(docs, query);
  console.log("重排后顺序（pageContent）：");
  for (const document of ranked) {
    console.log("-", document.pageContent);
  }
}

main().catch((error) => {
  console.error("Rerank 示例失败：", error.message);
  process.exitCode = 1;
});
