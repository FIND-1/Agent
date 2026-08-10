import { existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

/**
 * 复习重点：把 Checkpointer 从内存替换为本地 SQLite 文件。
 * 相比 03，状态可跨进程保存；适合本地学习，不依赖 Docker 或数据库服务。
 * 局限：示例每次先删除旧文件以保证输出稳定，不演示生产并发与迁移。
 */
const dbPath = fileURLToPath(
  new URL("./_shared/checkpointer-demo.sqlite", import.meta.url),
);

const StateAnnotation = Annotation.Root({
  visitCount: Annotation({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  message: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

function recordVisit(state) {
  const visitCount = state.visitCount + 1;
  const message =
    visitCount === 1
      ? "这是你在本会话里第 1 次进入。"
      : `这是你在本会话里第 ${visitCount} 次进入。`;
  return { visitCount, message };
}

const graph = new StateGraph(StateAnnotation)
  .addNode("recordVisit", recordVisit)
  .addEdge(START, "recordVisit")
  .addEdge("recordVisit", END);

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

const checkpointer = SqliteSaver.fromConnString(dbPath);
const app = graph.compile({ checkpointer });

const user1 = { configurable: { thread_id: "用户-小张" } };
const user2 = { configurable: { thread_id: "用户-小李" } };

const res1 = await app.invoke({}, user1);
const res2 = await app.invoke({}, user1);
const res3 = await app.invoke({}, user1);
const res4 = await app.invoke({}, user2);

console.log(res1);
console.log(res2);
console.log(res3);
console.log(res4);
