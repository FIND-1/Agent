import "@lessons/shared/env-loader";
import { Configuration } from "dashscope-sdk-official";

// DashScope 原生 SDK 配置入口，供万相图片 / 视频生成示例共用。
// LangChain 聊天模型与 embeddings 的初始化由 ./model.mjs 管理。
// env-loader 加载仓库根 .env；本函数复用其中 EMBEDDINGS_API_KEY 配置的 DashScope Key，
// 变量名不限制它只能用于 embeddings；缺失时直接报错，不回退到其他服务商的 OPENAI_API_KEY。
// SDK 默认使用北京区 https://dashscope.aliyuncs.com/api/v1，
// 可通过 DASHSCOPE_HTTP_BASE_URL 指定与 Key 匹配的地域原生地址；
// 此处不读取 EMBEDDINGS_BASE_URL，也不使用 OpenAI 兼容接口的 /compatible-mode/v1 地址。
// 这里只校验 Key 非空并创建配置，真正的鉴权和生成请求发生在各示例的 client.call 中。
export function createDashScopeConfiguration() {
  const apiKey = process.env.EMBEDDINGS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("请在根 .env 中配置 DashScope 的 EMBEDDINGS_API_KEY。");
  }
  return new Configuration({ apiKey });
}
