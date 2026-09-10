/**
 * 复习：音频输入与流式文本输出，对比图像理解。
 * 在课程目录运行：node src/02-audio-understanding.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 音频理解 — qwen3-omni-flash
 * DashScope Qwen-Omni 支持 input_audio，要求流式调用；这里只输出文本。
 * 官方用法：https://help.aliyun.com/zh/model-studio/qwen-omni
 */
import { getChunkText } from "@lessons/shared/model";
import { createOmniModel } from "./_shared/omni-model.mjs";
import { HumanMessage } from "@langchain/core/messages";

// qwen3.8-flash 已被当前服务拒绝 audio 模态，不能靠消息格式转换补上音频能力。
const DEFAULT_MODEL = "qwen3-omni-flash";

// 复用根 .env 中现有的 DashScope 地址和配套 Key；变量名不决定调用类型。
// 音频理解仍走 Chat Completions，不调用用于生成向量的 createEmbeddings。
const model = createOmniModel(DEFAULT_MODEL);

// 输出最终模型，避免 DEFAULT_MODEL 与实际请求不一致时误导排查。
console.log("model:", model.model);

const stream = await model.stream([
  new HumanMessage({
    content: [
      { type: "text", text: "这段音频里说了什么？" },
      {
        type: "input_audio",
        input_audio: {
          data: "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250211/tixcef/cherry.wav",
          format: "wav",
        },
      },
    ],
  }),
]);

for await (const chunk of stream) {
  process.stdout.write(getChunkText(chunk));
}
process.stdout.write("\n");
