import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

/**
 * 复习入口：用最小示例认识 State、Node、Edge 和 compile/invoke。
 * StateGraph 适合把非线性工作流显式画成图；相比后续示例，这里只有固定顺序。
 * 局限：纯内存、无分支、无持久化，也不调用模型。
 */
const StateAnnotation = Annotation.Root({
  text: Annotation({
    reducer: (_previous, next) => next,
    default: () => "",
  }),
});

const step1 = (state) => ({ text: `${state.text} -> step1` });
const step2 = (state) => ({ text: `${state.text} -> step2` });

const graph = new StateGraph(StateAnnotation)
  .addNode("step1", step1)
  .addNode("step2", step2)
  .addEdge(START, "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", END)
  .compile();

const drawable = await graph.getGraphAsync();
console.log(drawable.drawMermaid({ withStyles: true }));
console.log("result:", await graph.invoke({ text: "hello" }));
