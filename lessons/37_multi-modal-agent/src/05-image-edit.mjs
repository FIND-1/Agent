/**
 * 复习：原图 + 编辑指令生成新图，为画布编辑链路做准备。
 * 在课程目录运行：node src/05-image-edit.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 图像编辑 — wan2.6-image
 * 使用 DashScope 原生 SDK；配置统一由 @lessons/shared/dashscope-client 提供。
 * 共享入口读取根 .env 的 EMBEDDINGS_API_KEY，地址配置说明见共享模块。
 */
import { createDashScopeConfiguration } from "@lessons/shared/dashscope-client";
import { writeFileSync } from "node:fs";
import { MultiModalConversation } from "dashscope-sdk-official";

const DEFAULT_MODEL = "wan2.6-image";

const imageUrl =
  "https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg";

const configuration = createDashScopeConfiguration();
// 万相图像编辑走 DashScope 原生 multimodal-generation，不能用 ChatOpenAI
const client = new MultiModalConversation(configuration);

const result = await client.call({
  model: DEFAULT_MODEL,
  // 编辑任务：同一条 message 里同时传 { text } 指令和 { image } 原图 URL
  messages: [
    {
      role: "user",
      content: [
        { text: "把图片背景改成下雪的冬天，人物保持不变" },
        { image: imageUrl },
      ],
    },
  ],
  prompt_extend: true, // 是否自动扩写提示词
  watermark: false, // 是否添加「AI 生成」水印
  n: 1, // 生成张数
  enable_interleave: false, // false = 图像编辑；true = 图文混排生成
  size: "1K", // 输出分辨率档位
});

if (result.status_code !== 200 || result.code) {
  throw new Error(result.message ?? `Request failed: ${result.status_code}`);
}

const resultUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image;
if (!resultUrl) {
  throw new Error(`No image URL in response: ${JSON.stringify(result)}`);
}

console.log("model:", DEFAULT_MODEL);
console.log("edited image URL:", resultUrl);

const imageResponse = await fetch(resultUrl);
writeFileSync(
  "output-wan-image-edit.png",
  Buffer.from(await imageResponse.arrayBuffer()),
);
console.log("Saved to output-wan-image-edit.png");
