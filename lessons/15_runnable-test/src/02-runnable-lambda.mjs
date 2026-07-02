import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

// 复习重点：
// RunnableLambda 把普通函数包装成 Runnable。
// 这样轻量的数据转换、日志和字段加工也可以进入 LCEL chain。

const addOne = RunnableLambda.from((input) => {
  console.log(`addOne 输入: ${input}`);
  return input + 1;
});

const multiplyTwo = RunnableLambda.from((input) => {
  console.log(`multiplyTwo 输入: ${input}`);
  return input * 2;
});

const chain = RunnableSequence.from([addOne, multiplyTwo, addOne]);

const result = await chain.invoke(5);

console.log("最终结果:", result);
