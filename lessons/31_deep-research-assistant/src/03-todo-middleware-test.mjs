import { readFile } from "node:fs/promises";

import "dotenv/config";
import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import {
  createAgent,
  HumanMessage,
  todoListMiddleware,
} from "langchain";

// 复习定位：这是独立的对照实验，用 createAgent + todoListMiddleware 观察 todo 如何进入 state；
// 它不参与深度调研主 Agent 的运行链路。

const model = createChatModel();

const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "你是生活规划助手。若输入状态已有 todos，则直接使用现有清单，不要重复创建；根据任务状态给出中文完成情况。若缺少生成具体方案所需的原始需求，应明确指出缺失信息，不要杜撰。",
  middleware: [todoListMiddleware()],
});

const inputUrl = new URL("../tmp.json", import.meta.url);
const input = JSON.parse(await readFile(inputUrl, "utf8"));

if (!Array.isArray(input.todos) || input.todos.length === 0) {
  throw new Error("tmp.json 必须包含非空 todos 数组");
}

const validStatuses = new Set(["pending", "in_progress", "completed"]);
const todos = input.todos.map(({ content, status }, index) => {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("tmp.json todos[" + index + "].content 必须是非空字符串");
  }
  if (!validStatuses.has(status)) {
    throw new Error(
      "tmp.json todos[" + index + "].status 必须是 pending、in_progress 或 completed",
    );
  }
  return { content: content.trim(), status };
});

const todoSummary = todos
  .map((todo, index) => `${index + 1}. [${todo.status}] ${todo.content}`)
  .join("\n");
const message = new HumanMessage(
  "以下 todo 状态已从 tmp.json 载入。请用中文汇总完成情况；如果无法仅根据清单还原具体执行结果，请说明还需要提供原始需求或执行产物。\n\n" +
    todoSummary,
);

const result = await agent.invoke(
  {
    messages: [message],
    todos,
  },
  {
    recursionLimit: 100,
  },
);

console.log("todos:", JSON.stringify(result.todos, null, 2));
console.log("─".repeat(50));
console.log("回复:", result.messages.at(-1)?.content);
