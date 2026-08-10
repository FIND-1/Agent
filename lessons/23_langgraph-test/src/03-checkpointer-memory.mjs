import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";

/**
 * 复习重点：Checkpointer 按 thread_id 保存并恢复图状态。
 * 相比 02，本例让多次 invoke 共享会话状态；MemorySaver 适合测试和演示。
 * 局限：进程退出后数据消失，不能作为生产持久化方案。
 */

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

/** 每跑一轮图，给「当前会话」访问次数 +1 */
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

const checkpointer = new MemorySaver();
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
