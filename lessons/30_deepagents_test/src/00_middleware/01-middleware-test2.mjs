import { z } from "zod";
import { Command } from "@langchain/langgraph";
import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import {
  createAgent,
  createMiddleware,
  HumanMessage,
  ToolMessage,
  tool,
} from "langchain";

/**
 * 复习定位：承接 middleware-test.mjs，继续观察 middleware 如何注入工具并包装工具调用。
 * wrapToolCall 既能读取调用参数，也能用 Command 同时更新消息和自定义 state。
 * 依赖模型正确选择工具；这里的时间工具本身不依赖外部服务。
 */

const getCurrentTime = tool(() => new Date().toISOString(), {
  name: "get_current_time",
  description: "返回当前 UTC 时间的 ISO 8601 字符串",
  schema: z.object({}),
});

/** 通过 middleware 注册工具，并用 wrapToolCall 包装执行 */
const extendedToolsMiddleware = createMiddleware({
  name: "ExtendedToolsMiddleware",
  stateSchema: z.object({
    toolInvocationCount: z.number().default(0),
  }),
  tools: [getCurrentTime],
  wrapToolCall: async (request, handler) => {
    const toolName = request.tool?.name ?? request.toolCall.name;
    console.log(
      `[Tools] 即将执行: ${toolName}`,
      "args:",
      request.toolCall.args ?? {},
    );
    const result = await handler(request);
    if (!ToolMessage.isInstance(result)) return result;

    const wrapped = new ToolMessage({
      content: `${result.content}\n[wrapToolCall] 已由 ExtendedToolsMiddleware 包装`,
      tool_call_id: result.tool_call_id,
      name: result.name,
    });
    console.log(
      `[Tools] 执行完成: ${toolName}`,
      typeof wrapped.content === "string"
        ? wrapped.content.slice(0, 120)
        : wrapped,
    );
    return new Command({
      update: {
        toolInvocationCount: request.state.toolInvocationCount + 1,
        messages: [wrapped],
      },
    });
  },
  afterAgent: (state) => {
    console.log(
      `[Tools] agent 结束，middleware 统计工具调用: ${state.toolInvocationCount} 次`,
    );
  },
});

const model = createChatModel();
const agent = createAgent({
  model,
  tools: [],
  systemPrompt: "你是一个助手。",
  middleware: [extendedToolsMiddleware],
});

for (const text of ["给我当前时间"]) {
  console.log("\n用户:", text);
  const { messages, toolInvocationCount } = await agent.invoke({
    messages: [new HumanMessage(text)],
  });
  console.log("回复:", messages.at(-1)?.content);
  console.log("toolInvocationCount:", toolInvocationCount);
}
