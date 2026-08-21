/**
 * 原文 `src/rag/query-augment.mjs` 的编号观察入口：单独运行 LLM 查询改写。
 * 与完整 RAG 示例相比，本例只验证“原始问题 -> 3 条检索问句”，需要根目录 .env 和 Chat API。
 */
import { ChatOpenAI } from "@langchain/openai";
import { readEsAgentEnv } from "../_shared/env.mjs";
import {
  augmentQuery,
  retrievalQueryStrings,
} from "../_shared/query-augment.mjs";

async function main() {
  const { apiKey, baseUrl, modelName } = readEsAgentEnv([
    "apiKey",
    "baseUrl",
    "modelName",
  ]);

  const chatModel = new ChatOpenAI({
    model: modelName,
    apiKey,
    temperature: 0.2,
    configuration: {
      baseURL: baseUrl,
    },
  });

  const query = "家里无线老是断断续续的咋整啊";
  const augmentation = await augmentQuery(chatModel, query);

  console.log("原始问题：", query);
  console.log("LLM 生成的 3 条检索问句：", augmentation.queries);
  console.log("实际参与检索的问句：", retrievalQueryStrings(query, augmentation));
}

main().catch((error) => {
  console.error("Query Augmentation 示例失败：", error.message);
  process.exitCode = 1;
});
