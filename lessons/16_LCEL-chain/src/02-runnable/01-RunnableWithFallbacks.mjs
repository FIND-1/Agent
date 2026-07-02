import { RunnableLambda } from "@langchain/core/runnables";

/**
 * 复习重点：
 * withRetry 是“同一个 Runnable 重试多次”；
 * withFallbacks 是“主 Runnable 失败后，换备选 Runnable 继续处理”。
 *
 * 这个示例解决的问题：
 * 当高级服务、标准服务都不可用时，自动降级到本地方案。
 */

// 模拟三个“翻译服务”，优先级从高到低。
const premiumTranslator = RunnableLambda.from(async () => {
  console.log("[Premium] 尝试翻译...");
  // 模拟高级服务不可用。
  throw new Error("Premium 服务超时");
});

const standardTranslator = RunnableLambda.from(async () => {
  console.log("[Standard] 尝试翻译...");
  // 模拟标准服务也挂了。
  throw new Error("Standard 服务限流");
});

const localTranslator = RunnableLambda.from(async (text) => {
  console.log("[Local] 使用本地词典翻译...");
  const dict = { hello: "你好", world: "世界", goodbye: "再见" };
  const words = text.toLowerCase().split(" ");
  return words.map((word) => dict[word] ?? word).join("");
});

// withFallbacks：依次尝试 premium -> standard -> local。
const translator = premiumTranslator.withFallbacks({
  fallbacks: [standardTranslator, localTranslator],
});

const result = await translator.invoke("hello world");
console.log("翻译结果:", result);
