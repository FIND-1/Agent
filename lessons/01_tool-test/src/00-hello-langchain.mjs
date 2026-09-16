/**
 * 示例 00：最小模型调用（对应文章开头「首先，我们找个大模型来用」）
 *
 * 原文这里分两步走：
 * 1. 先直接在代码里写 apiKey + baseURL，用 new ChatOpenAI({...}) 调通模型；
 * 2. 发现密钥写死不好，再改成 .env + dotenv，用 process.env.* 动态读取，
 *    并把 .env 加进 .gitignore（原文强调：私密信息不提交 git）。
 *
 * 本课把第 2 步收敛到项目级共享入口 @lessons/shared/model：
 * - env-loader 从仓库根目录 .env 读取 OPENAI_API_KEY / OPENAI_BASE_URL / MODEL_NAME；
 * - createChatModel() 默认 temperature = 0，与原文「温度设为 0，让它严格按照指令做事」一致。
 * 这样每个示例不必重复写 ChatOpenAI 初始化，复习时只关注当前知识点。
 *
 * 学习目的：先确认「模型能调通」，为后面的 tool 示例排除环境问题。
 * 依赖：需要模型 API（仓库根目录 .env 中的 OPENAI_* 与 MODEL_NAME）。
 * 局限：没有 tool、没有 messages 组织，只演示单轮 invoke。
 * 原文路径映射：src/hello-langchain.mjs -> src/00-hello-langchain.mjs
 * 原文命令：node ./src/hello-langchain.mjs（现在写 node src/00-hello-langchain.mjs）
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
const model = createChatModel({
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
});

const response = await model.invoke("介绍下自己");
console.log(response.content);



