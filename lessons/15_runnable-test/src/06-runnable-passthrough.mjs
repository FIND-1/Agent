import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";

// 复习重点：
// RunnablePassthrough 用来保留原始输入或原始对象。
// assign() 适合在不丢失已有字段的前提下追加派生字段，效果类似 Object.assign。

const chain = RunnableSequence.from([
  (input) => ({ concept: input }),
  RunnablePassthrough.assign({
    original: new RunnablePassthrough(),
    processed: (obj) => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    }),
  }),
]);

const input = "神说要有光";
const result = await chain.invoke(input);

console.log(result);
