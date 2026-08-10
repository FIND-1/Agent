import { createInterface } from "node:readline/promises";
import {
  Annotation,
  Command,
  END,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
} from "@langchain/langgraph";

/**
 * 复习重点：interrupt 暂停图，Command({ resume }) 从同一 thread_id 恢复。
 * 相比 04，本例在持久状态之上加入 Human-in-the-loop；适合审批和高风险操作。
 * 局限：需要终端交互，本例只记录输入，没有实现真实转账或授权校验。
 */

const StateAnnotation = Annotation.Root({
  actionSummary: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  userInput: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

/** 展示一笔待确认的转账 */
const showTransfer = () => ({
  actionSummary: "向张三转账 ¥100（模拟，不会真扣款）",
});

/** 停在这里等人输入；resume 的值会写进 userInput */
const waitConfirm = (state) => {
  const text = interrupt({
    hint: "终端里输入「确认」或备注后回车，图才会继续",
    actionSummary: state.actionSummary,
  });
  return { userInput: String(text) };
};

const graph = new StateGraph(StateAnnotation)
  .addNode("showTransfer", showTransfer)
  .addNode("waitConfirm", waitConfirm)
  .addEdge(START, "showTransfer")
  .addEdge("showTransfer", "waitConfirm")
  .addEdge("waitConfirm", END)
  .compile({ checkpointer: new MemorySaver() });

const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);

const config = { configurable: { thread_id: "interrupt-demo" } };

const paused = await graph.invoke({}, config);
console.log("\n待你确认：", paused.__interrupt__?.[0]?.value);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const line = (await rl.question("> ")).trim();
await rl.close();

if (!line) {
  console.error("未输入，退出。");
  process.exit(1);
}

const done = await graph.invoke(new Command({ resume: line }), config);
console.log("结果：", done);
