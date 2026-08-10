import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel } from "@lessons/shared/model";
import { getProductBySku } from "./_shared/inventory.mjs";

/**
 * 复习重点：ToolNode 执行 tool call，toolsCondition 决定继续调用工具还是结束。
 * 相比 05，本例进入标准 agent loop；适合需要模型自主选择工具的场景。
 * 依赖：根目录 .env 中的模型配置；结果受模型工具调用能力影响。
 */

const getProductStock = tool(async ({ sku }) => getProductBySku(sku), {
  name: "get_product_stock",
  description: "按 SKU 查商品名与库存，SKU 如 SKU-001。",
  schema: z.object({
    sku: z.string().describe("商品 SKU"),
  }),
});

const tools = [getProductStock];
const llm = createChatModel().bindTools(tools);

async function agent(state) {
  const response = await llm.invoke(state.messages);
  return { messages: response };
}

const toolNode = new ToolNode(tools);

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agent)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition, ["tools", END])
  .addEdge("tools", "agent")
  .compile();

const result = await graph.invoke({
  messages: [
    new HumanMessage("查一下 SKU-001 的库存还有多少，回答里带上商品名和数字。"),
  ],
});

const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);

const last = result.messages.at(-1);
console.log(last?.content ?? result.messages);
