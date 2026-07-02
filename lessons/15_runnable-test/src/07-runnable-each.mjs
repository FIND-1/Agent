import { RunnableEach, RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

// 复习重点：
// RunnableEach 把同一条 chain 应用到数组的每个元素。
// 它适合把单条处理逻辑扩展到列表输入，而不把循环逻辑散落到业务代码里。

const toUpperCase = RunnableLambda.from((input) => input.toUpperCase());
const addGreeting = RunnableLambda.from((input) => `你好，${input}！`);

const processItem = RunnableSequence.from([
  toUpperCase,
  addGreeting,
]);

const chain = new RunnableEach({
  bound: processItem,
});

const input = ["alice", "bob", "carol"];
const result = await chain.invoke(input);

console.log("RunnableEach - 数组元素处理:");
console.log("输入:", input);
console.log("输出:", result);
