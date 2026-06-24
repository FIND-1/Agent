import 'dotenv/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

// 复习重点：
// 这些模型初始化参数不是本章要讲的 Prompt Template 主线。
// 抽到共享文件后，每个示例可以更聚焦在模板、消息和示例选择本身。

export function createChatModel(options = {}) {
  return new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
    ...options,
  });
}

export function createEmbeddings(options = {}) {
  return new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
    ...options,
  });
}
