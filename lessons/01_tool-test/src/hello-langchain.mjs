import dotenv from "dotenv"; // dotenv 的作用就是读取 .env 文件，设置到环境变量里
import { ChatOpenAI } from "@langchain/openai"; // 导入 LangChain 的 OpenAI 模型
// 读取 .env 文件，设置到环境变量里
dotenv.config();
const model = new ChatOpenAI({ // 创建一个 OpenAI 模型
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
  apiKey: process.env.OPENAI_API_KEY || "",
  configuration: {
    baseURL: process.env.BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const response = await model.invoke("介绍下自己");
console.log(response.content);
