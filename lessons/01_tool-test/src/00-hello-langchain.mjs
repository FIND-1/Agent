/**
 * 示例 00：最小模型调用
 *
 * 对应原文「首先，我们找个大模型来用」。
 * 本例只验证模型能调通，为后续 tool 示例排除环境问题。
 *
 * 模型初始化已封装到 @lessons/shared/model；
 * API Key / Base URL / 模型名从仓库根目录 .env 读取。
 *
 * 依赖：OPENAI_API_KEY / OPENAI_BASE_URL / MODEL_NAME
 * 运行：node src/00-hello-langchain.mjs
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";

const model = createChatModel({
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
});

const response = await model.invoke("介绍下自己");
console.log(response.content);

