import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

/**
 * 复习重点：用 addConditionalEdges 根据 state 选择后继节点。
 * 相比 00，图从固定直线升级为分支；适合路由、分类和条件决策。
 * 局限：数学判断和 eval 只为突出路由概念，不应直接用于生产输入。
 */

const StateAnnotation = Annotation.Root({
  query: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  route: Annotation({
    reducer: (_prev, next) => next,
    default: () => "chat",
  }),
  answer: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

const router = (state) => {
  const isMath = /[+\-*/]/.test(state.query);
  return { route: isMath ? "math" : "chat" };
};

const mathNode = (state) => {
  try {
    return { answer: String(eval(state.query)) };
  } catch {
    return { answer: "表达式无法计算" };
  }
};

const chatNode = (state) => ({ answer: `你说的是：${state.query}` });

const graph = new StateGraph(StateAnnotation)
  .addNode("router", router)
  .addNode("math", mathNode)
  .addNode("chat", chatNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", (state) => state.route, {
    math: "math",
    chat: "chat",
  })
  .addEdge("math", END)
  .addEdge("chat", END)
  .compile();

const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);

console.log("result:", await graph.invoke({ query: "你好" }));
console.log("result:", await graph.invoke({ query: "10 * 8" }));
