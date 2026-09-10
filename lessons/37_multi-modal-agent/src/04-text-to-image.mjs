/**
 * 复习：文本生成图片：理解结果 URL 与实际文件的区别。
 * 在课程目录运行：node src/04-text-to-image.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 文生图 — wan2.6-t2i
 * 使用 DashScope 原生 SDK；配置统一由 @lessons/shared/dashscope-client 提供。
 * 共享入口读取根 .env 的 EMBEDDINGS_API_KEY，地址配置说明见共享模块。
 */
import { createDashScopeConfiguration } from "@lessons/shared/dashscope-client";
import { writeFileSync } from "node:fs";
import { MultiModalConversation } from "dashscope-sdk-official";

const DEFAULT_MODEL = "wan2.6-t2i";

const configuration = createDashScopeConfiguration();
// 万相文生图走 DashScope 原生 multimodal-generation，不能用 ChatOpenAI
const client = new MultiModalConversation(configuration);

const result = await client.call({
  model: DEFAULT_MODEL,
  // messages.content 用 { text } / { image } 格式，不是 OpenAI 的 type 字段
  messages: [
    {
      role: "user",
      content: [{ text: "一间有着精致窗户的花店，漂亮的木质门，摆放着花朵" }],
    },
  ],
  size: "1280*1280", // 输出分辨率，格式为 宽*高
  n: 1, // 生成张数
  watermark: false, // 是否添加「AI 生成」水印
});

if (result.status_code !== 200 || result.code) {
  throw new Error(result.message ?? `Request failed: ${result.status_code}`);
}

const imageUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image;
if (!imageUrl) {
  throw new Error(`No image URL in response: ${JSON.stringify(result)}`);
}

console.log("model:", DEFAULT_MODEL);
console.log("image URL:", imageUrl);

const imageResponse = await fetch(imageUrl);
writeFileSync(
  "output-wan-text-to-image.png",
  Buffer.from(await imageResponse.arrayBuffer()),
);
console.log("Saved to output-wan-text-to-image.png");
