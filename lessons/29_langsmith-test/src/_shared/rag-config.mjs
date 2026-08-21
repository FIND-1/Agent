// 本 lesson 的固定配置集中放在这里，避免每个示例重复散落环境变量默认值。
// 模型和 embedding 初始化统一复用 lessons/_shared/model.mjs。

export const MILVUS_COLLECTION = process.env.MILVUS_COLLECTION ?? "rag_docs";

export const MILVUS_URI = process.env.MILVUS_URI ?? "http://localhost:19530";

export const MILVUS_ADDRESS = MILVUS_URI.replace(/^https?:\/\//, "");

export const CHAT_MODEL = process.env.MODEL_NAME ?? "qwen-plus";

export const DATASET_NAME = "rag-eval-v1";
