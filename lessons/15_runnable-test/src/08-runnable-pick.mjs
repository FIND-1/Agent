import { RunnablePick, RunnableSequence } from "@langchain/core/runnables";

// 复习重点：
// RunnablePick 从对象里挑选指定字段作为最终输出。
// 它适合隐藏中间字段，让对外暴露的 chain 输出更稳定。

const inputData = {
  name: "张三",
  age: 30,
  city: "上海",
  country: "中国",
  email: "zhangsan@example.com",
  phone: "+86-13900000000",
};

const chain = RunnableSequence.from([
  (input) => ({
    ...input,
    fullInfo: `${input.name}，${input.age} 岁，来自 ${input.city}`,
  }),
  new RunnablePick(["name", "fullInfo"]),
]);

const result = await chain.invoke(inputData);

console.log(result);
