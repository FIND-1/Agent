import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

/**
 * 复习重点：
 * callbacks 可以在不改动每个 Runnable 业务逻辑的情况下，观察 chain 的执行过程。
 *
 * 原文示例是一条文本处理链：清洗 -> 分词 -> 统计。
 * callbacks 用来打印每一步的开始、结束和错误，适合调试、日志和链路观察。
 */

// 文本处理链：清洗 -> 分词 -> 统计。
const clean = RunnableLambda.from((text) => {
  return text.trim().replace(/\s+/g, " ");
});

const tokenize = RunnableLambda.from((text) => {
  return text.split(" ");
});

const count = RunnableLambda.from((tokens) => {
  return { tokens, wordCount: tokens.length };
});

const chain = RunnableSequence.from([clean, tokenize, count]);

// 用 callbacks 观测每一步的输出。
const callback = {
  handleChainStart(chainInfo) {
    const step = chainInfo.id?.[chainInfo.id.length - 1] ?? "unknown";
    console.log(`[START] ${step}`);
  },
  handleChainEnd(output) {
    console.log(`[END]   output=${JSON.stringify(output)}\n`);
  },
  handleChainError(error) {
    console.log(`[ERROR] ${error.message}\n`);
  },
};

const result = await chain.invoke("  hello   world   from   langchain  ", {
  callbacks: [callback],
});

console.log("结果:", result);
