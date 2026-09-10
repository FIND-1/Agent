/**
 * 复习：参考首帧生成视频，对比 size 与 resolution。
 * 在课程目录运行：node src/07-image-to-video.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 图生视频 — wan2.6-i2v-flash
 * 使用 DashScope 原生 SDK（自动轮询异步任务）；配置由 @lessons/shared/dashscope-client 提供。
 * 共享入口读取根 .env 的 EMBEDDINGS_API_KEY，地址配置说明见共享模块。
 */
import { createDashScopeConfiguration } from "@lessons/shared/dashscope-client";
import { writeFileSync } from "node:fs";
import { VideoSynthesis } from "dashscope-sdk-official";

const DEFAULT_MODEL = "wan2.6-i2v-flash";

const configuration = createDashScopeConfiguration();
// 视频生成是异步任务；VideoSynthesis.call 内部会提交任务并轮询至完成
const client = new VideoSynthesis(configuration);

console.log("model:", DEFAULT_MODEL);
console.log("creating video task...");

const result = await client.call({
  model: DEFAULT_MODEL,
  prompt: "女孩缓缓转头，海风吹动头发，阳光洒在沙滩上，镜头缓慢推进", // 运动/镜头描述
  img_url:
    "https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg", // 首帧参考图，图生视频必填
  resolution: "720P", // 图生视频用 resolution（如 720P / 1080P）
  prompt_extend: true, // 是否自动扩写提示词
  duration: 5, // 视频时长（秒）
});

const taskStatus = result.output?.task_status;
console.log("task_status:", taskStatus);

if (taskStatus === "FAILED") {
  throw new Error(result.output?.message ?? result.message ?? "Task failed");
}

const videoUrl = result.output?.video_url;
if (!videoUrl) {
  throw new Error(`No video URL in response: ${JSON.stringify(result)}`);
}

console.log("video URL:", videoUrl);
const videoResponse = await fetch(videoUrl);
writeFileSync(
  "output-wan-image-to-video.mp4",
  Buffer.from(await videoResponse.arrayBuffer()),
);
console.log("Saved to output-wan-image-to-video.mp4");
