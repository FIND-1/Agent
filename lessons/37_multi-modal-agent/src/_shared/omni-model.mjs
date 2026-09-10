import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";

// 仅音频、视频两个文件共用；模型构造仍复用跨课工厂。
// EMBEDDINGS_* 在本课承载 DashScope 兼容接口配置，并不代表调用向量模型。
export function createOmniModel(model) {
  const baseURL = process.env.EMBEDDINGS_BASE_URL;
  const apiKey = process.env.EMBEDDINGS_API_KEY;
  if (!baseURL?.trim() || !apiKey?.trim()) {
    throw new Error(
      "请在根 .env 中配置 DashScope 的 EMBEDDINGS_BASE_URL 和 EMBEDDINGS_API_KEY。",
    );
  }
  return createChatModel({
    model,
    baseURL,
    apiKey,
    modelKwargs: { modalities: ["text"] },
  });
}
