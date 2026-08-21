import "@lessons/shared/env-loader";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// 统一模型工厂：
// - Chat 示例默认使用根 .env 的 MODEL_NAME / OPENAI_* 配置。
// - Embeddings 示例优先使用 EMBEDDINGS_*，缺省时回退到 OPENAI_*。
// - 各 lesson 如需特殊 temperature / modelName，可通过 options 覆盖。

export function createChatModel(options = {}, temperature = 0) {
  return new ChatOpenAI({
    model: process.env.MODEL_NAME,
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
    ...options,
  });
}

export function createEmbeddings(options = {}) {
  return new OpenAIEmbeddings({
    apiKey: process.env.EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME || process.env.EMBEDDING_MODEL,
    dimensions: Number(process.env.EMBEDDINGS_DIMENSIONS) || undefined,
    configuration: {
      baseURL: process.env.EMBEDDINGS_BASE_URL || process.env.OPENAI_BASE_URL,
    },
    ...options,
  });
}

export function getChunkText(chunk) {
  if (typeof chunk.content === "string") return chunk.content;
  if (Array.isArray(chunk.content)) {
    return chunk.content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item.text === "string") return item.text;
        return "";
      })
      .join("");
  }
  return "";
}
