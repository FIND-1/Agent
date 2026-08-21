/**
 * 在进入完整混合检索图之前，单独观察原始问题如何扩展为 3 个检索角度。
 * 本例需要根目录 .env 和 Chat API；改写失败时共享模块会退化为原始问题。
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
    apiKey,
    model: modelName,
    temperature: 0.2,
    configuration: { baseURL: baseUrl },
  });
  const query = "雨天回家后，玄关怎样保持干燥？";
  const augmentation = await augmentQuery(chatModel, query);

  console.log("LLM 生成的 3 条问句：", augmentation.queries);
  console.log(
    "实际参与检索的问句：",
    retrievalQueryStrings(query, augmentation),
  );
}

main().catch((error) => {
  console.error("Query 改写示例失败：", error.message);
  process.exitCode = 1;
});
