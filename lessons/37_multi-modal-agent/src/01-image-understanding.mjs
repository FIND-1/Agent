/**
 * 复习：图像 URL + 文本输入，观察模型理解结果。
 * 在课程目录运行：node src/01-image-understanding.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
/**
 * 图像理解 — qwen-vl-plus
 * DashScope OpenAI 兼容接口 + ChatOpenAI
 */
import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { HumanMessage } from "@langchain/core/messages";

const DEFAULT_MODEL = "qwen-vl-plus";

const model = createChatModel({ model: DEFAULT_MODEL });

const response = await model.invoke([
  new HumanMessage({
    content: [
      { type: "text", text: "详细描述这张图片的内容" },
      {
        type: "image_url",
        image_url: {
          url: "https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg",
        },
      },
    ],
  }),
]);

console.log("model:", DEFAULT_MODEL);
console.log(response.content);
