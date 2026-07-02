import { RunnableBranch, RunnableLambda } from "@langchain/core/runnables";

// 复习重点：
// RunnableBranch 用来表达 if / else if / else。
// 条件从上到下匹配，命中第一个条件后就执行对应分支。

const isPositive = RunnableLambda.from((input) => input > 0);
const isNegative = RunnableLambda.from((input) => input < 0);
const isEven = RunnableLambda.from((input) => input % 2 === 0);

const handlePositive = RunnableLambda.from((input) => `正数: ${input} + 10 = ${input + 10}`);
const handleNegative = RunnableLambda.from((input) => `负数: ${input} - 10 = ${input - 10}`);
const handleEven = RunnableLambda.from((input) => `偶数: ${input} * 2 = ${input * 2}`);
const handleDefault = RunnableLambda.from((input) => `默认: ${input}`);

const branch = RunnableBranch.from([
  [isPositive, handlePositive],
  [isNegative, handleNegative],
  [isEven, handleEven],
  handleDefault,
]);

const testCases = [5, -3, 4, 0];

for (const testCase of testCases) {
  const result = await branch.invoke(testCase);
  console.log(`输入: ${testCase} => ${result}`);
}
