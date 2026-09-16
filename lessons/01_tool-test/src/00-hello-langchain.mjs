import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
const model = createChatModel({
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
});

const response = await model.invoke("介绍下自己");
console.log(response.content);



