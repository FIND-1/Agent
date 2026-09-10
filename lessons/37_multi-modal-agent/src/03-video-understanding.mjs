/**
 * 复习：视频 URL 输入，沿用 Omni 流式协议。
 * 在课程目录运行：node src/03-video-understanding.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 视频理解 — qwen3-omni-flash
 * DashScope OpenAI 兼容接口 + ChatOpenAI；输入 video_url，流式输出文本。
 * 官方用法：https://help.aliyun.com/zh/model-studio/qwen-omni
 */
import "@lessons/shared/env-loader";
import { getChunkText } from "@lessons/shared/model";
import { createOmniModel } from "./_shared/omni-model.mjs";
import { HumanMessage } from "@langchain/core/messages";

const DEFAULT_MODEL = "qwen3-omni-flash";

// 复用根 .env 的 DashScope 地址和配套 Key；视频理解仍调用 Chat 模型，不生成向量。
const model = createOmniModel(DEFAULT_MODEL);

console.log("model:", model.model);

// Qwen-Omni 要求流式调用；视频 URL 必须能由服务端访问。
const stream = await model.stream([
  new HumanMessage({
    content: [
      { type: "text", text: "总结这个视频的主要内容" },
      {
        type: "video_url",
        video_url: {
          url: "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241115/cqqkru/1.mp4",
        },
      },
    ],
  }),
]);

for await (const chunk of stream) {
  process.stdout.write(getChunkText(chunk));
}
process.stdout.write("\n");
