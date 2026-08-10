import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { createChatModel } from "@lessons/shared/model";
import { getProductBySku } from "./_shared/inventory.mjs";

/**
 * 复习重点：createAgent 封装了 06 手写的 model → tools → model 循环。
 * 适合常规工具型 Agent；需要自定义节点、边或状态时仍应回到 StateGraph。
 * 依赖：根目录 .env；MemorySaver 只保存当前进程内的同一 thread_id 状态。
 */

const getProductStock = tool(async ({ sku }) => getProductBySku(sku), {
  name: "get_product_stock",
  description: "按 SKU 查商品名与库存，SKU 如 SKU-001。",
  schema: z.object({
    sku: z.string().describe("商品 SKU"),
  }),
});

const model = createChatModel();

const agent = createAgent({
  model,
  tools: [getProductStock],
  systemPrompt:
    "你是仓库助手。问库存时必须调用 get_product_stock（模拟数据），禁止编造。",
  checkpointer: new MemorySaver(),
});

const result = await agent.invoke(
  { messages: [new HumanMessage("SKU-002 还剩多少库存？")] },
  { configurable: { thread_id: "demo-thread" } },
);

const drawable = await agent.graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);

const last = result.messages.at(-1);
console.log(last?.content ?? result);
