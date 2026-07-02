import { RunnableLambda } from "@langchain/core/runnables";

/**
 * 复习重点：
 * 原文在 MCP 和 RAG 两个综合案例之后，开始演示 Runnable 节点的增强能力。
 *
 * 这个示例解决的问题：
 * 给某个 Runnable 节点加上重试逻辑，不需要自己写 for 循环和 try/catch 重试。
 *
 * 适用场景：
 * 模型调用、远程 API、MCP 工具、数据库查询等偶发失败。
 */

let attempt = 0;

// 一个会随机失败的 Runnable，用来演示 withRetry。
const unstableRunnable = RunnableLambda.from(async (input) => {
  attempt += 1;
  console.log(`第 ${attempt} 次尝试，输入: ${input}`);

  // 模拟 70% 概率失败的情况。
  if (Math.random() < 0.7) {
    console.log("本次尝试失败，抛出错误。");
    throw new Error("模拟的随机错误");
  }

  console.log("本次尝试成功。");
  return `成功处理: ${input}`;
});

// 使用 withRetry 为 runnable 加上重试逻辑。
const runnableWithRetry = unstableRunnable.withRetry({
  // 总共最多 5 次尝试。
  stopAfterAttempt: 5,
});

try {
  const result = await runnableWithRetry.invoke("演示 withRetry");
  console.log("最终结果:", result);
} catch (error) {
  console.error("重试多次后仍然失败:", error?.message ?? error);
}
