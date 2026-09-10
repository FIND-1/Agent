import "@lessons/shared/env-loader";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// LangChain 模型工厂：创建聊天模型、embeddings，并提供流式文本提取。
// DashScope 原生图片 / 视频生成的 SDK 配置由 ./dashscope-client.mjs 管理。
// DashScope 的 OpenAI 兼容聊天接口仍可通过本模块传入配套 apiKey / baseURL 使用。
// - Chat 示例优先使用显式 model / modelName，未传入时使用根 .env 的 MODEL_NAME。
// - API Key / baseURL 默认使用 OPENAI_* 配置；模型名称不会自动切换服务商。
// - Embeddings 示例优先使用 EMBEDDINGS_*，缺省时回退到 OPENAI_*。
// - 各 lesson 如需特殊 temperature / modelName / apiKey / baseURL，可通过 options 覆盖：
//   - options.baseURL 直传时优先于环境变量；
//   - options.configuration 仍可整体覆盖底层 OpenAI client 配置（其内部字段优先级最高）。

export function createChatModel(options = {}, temperature = 0) {
  const { baseURL, configuration, model, modelName, ...rest } = options;
  const resolvedModel = model ?? modelName ?? process.env.MODEL_NAME;
  return new ChatOpenAI({
    model: resolvedModel,
    modelName: resolvedModel,
    apiKey: process.env.OPENAI_API_KEY,
    temperature,
    configuration: {
      baseURL: baseURL || process.env.OPENAI_BASE_URL,
      ...configuration,
    },
    ...rest,
  });
}

export function createEmbeddings(options = {}) {
  const { baseURL, configuration, ...rest } = options;
  return new OpenAIEmbeddings({
    apiKey: process.env.EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME || process.env.EMBEDDING_MODEL,
    dimensions: Number(process.env.EMBEDDINGS_DIMENSIONS) || undefined,
    configuration: {
      baseURL:
        baseURL ||
        process.env.EMBEDDINGS_BASE_URL ||
        process.env.OPENAI_BASE_URL,
      ...configuration,
    },
    ...rest,
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
