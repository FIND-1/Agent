import "dotenv/config";
import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";

// 复习定位：DeepAgents 会依据 model.profile.maxInputTokens 判断何时压缩上下文；本例只演示
// 给兼容模型补 profile 的方式，不会真正触发长对话摘要，也不调用模型。

const model = createChatModel()

console.log(model.profile.maxInputTokens);

Object.defineProperty(model, "profile", {
  get: () => ({ maxInputTokens: 8_000 }),
});

console.log(model.profile.maxInputTokens);
