import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableMap } from "@langchain/core/runnables";

// 复习重点：
// RunnableMap 会把同一个输入并行交给多个 Runnable。
// 它适合同时生成多个派生结果，最后按对象 key 汇总输出。

const addOne = RunnableLambda.from((input) => input.num + 1);
const multiplyTwo = RunnableLambda.from((input) => input.num * 2);
const square = RunnableLambda.from((input) => input.num * input.num);

const greetTemplate = PromptTemplate.fromTemplate("你好，{name}！");
const weatherTemplate = PromptTemplate.fromTemplate("今天天气{weather}。");

const runnableMap = RunnableMap.from({
  add: addOne,
  multiply: multiplyTwo,
  square,
  greeting: greetTemplate,
  weather: weatherTemplate,
});

const input = {
  name: "张三",
  weather: "多云",
  num: 5,
};

const result = await runnableMap.invoke(input);

console.log(result);
