/**
 * 复习：文本生成视频：提交异步任务并由 SDK 轮询。
 * 在课程目录运行：node src/06-text-to-video.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 文生视频 — wan2.6-t2v
 * 使用 DashScope 原生 SDK（自动轮询异步任务）；配置由 @lessons/shared/dashscope-client 提供。
 * 共享入口读取根 .env 的 EMBEDDINGS_API_KEY，地址配置说明见共享模块。
 */
import { createDashScopeConfiguration } from "@lessons/shared/dashscope-client";
import { writeFileSync } from "node:fs";
import { VideoSynthesis } from "dashscope-sdk-official";

const DEFAULT_MODEL = "wan2.6-t2v";

const configuration = createDashScopeConfiguration();
// 视频生成是异步任务；VideoSynthesis.call 内部会提交任务并轮询至完成
const client = new VideoSynthesis(configuration);

console.log("model:", DEFAULT_MODEL);
console.log("creating video task...");

const result = await client.call({
  model: DEFAULT_MODEL,
  prompt: "一只橘猫在窗台上晒太阳，微风吹动窗帘，镜头缓慢推进，电影质感", // 画面与运动描述
  size: "1280*720", // 文生视频用 size（宽*高），与图生视频的 resolution 不同
  prompt_extend: true, // 是否自动扩写提示词
  duration: 5, // 视频时长（秒）
  watermark: false, // 是否添加「AI 生成」水印
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
  "output-wan-text-to-video.mp4",
  Buffer.from(await videoResponse.arrayBuffer()),
);
console.log("Saved to output-wan-text-to-video.mp4");
