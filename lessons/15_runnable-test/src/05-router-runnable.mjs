import { RunnableLambda } from "@langchain/core/runnables";

// 复习重点：
// 文章里的 RouterRunnable 用来根据 key 选择要执行的 Runnable。
// 当前依赖版本没有导出 RouterRunnable，这里用 RunnableLambda + routes 保留同样的路由思路。

const toUpperCase = RunnableLambda.from((text) => text.toUpperCase());
const reverseText = RunnableLambda.from((text) => text.split("").reverse().join(""));

const routes = {
  toUpperCase,
  reverseText,
};

// 当前 @langchain/core 版本没有导出 RouterRunnable。
// 这里用 RunnableLambda 包一层路由表，表达同样的 switch-case 思路。
const router = RunnableLambda.from(async ({ key, input }) => {
  const runnable = routes[key];
  if (!runnable) {
    throw new Error(`未知路由: ${key}`);
  }

  return runnable.invoke(input);
});

const result1 = await router.invoke({ key: "reverseText", input: "Hello World" });
console.log("reverseText 结果:", result1);

const result2 = await router.invoke({ key: "toUpperCase", input: "Hello World" });
console.log("toUpperCase 结果:", result2);
