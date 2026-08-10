import { HumanMessage } from "@langchain/core/messages";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { createChatModel } from "@lessons/shared/model";

import { lookupCityTrivia, lookupWeather } from "./_shared/city-data.mjs";

/**
 * 复习重点：Supervisor 根据任务把请求交给职责单一的 Worker Agent。
 * 相比 07，本例从单 Agent 升级为多 Agent 调度，减少无关工具和提示词干扰。
 * 依赖：根目录 .env；模型若不稳定遵守 handoff 约束，路径可能与预期不同。
 */
const model = createChatModel();

const lookupWeatherTool = tool(async ({ city }) => lookupWeather(city), {
  name: "lookup_weather",
  description: "查询某城市当日天气概况（气温区间、天气、空气质量等）。",
  schema: z.object({
    city: z.string().describe("城市名，如 杭州"),
  }),
});

const lookupCityTriviaTool = tool(async ({ city }) => lookupCityTrivia(city), {
  name: "lookup_city_trivia",
  description: "查询与某城市相关的一句趣味知识。",
  schema: z.object({
    city: z.string().describe("城市名，如 杭州"),
  }),
});

/** 子代理 A：只回答「天气」类问题 */
const weatherAgent = createAgent({
  name: "weather_agent",
  description: "专门查天气",
  model,
  tools: [lookupWeatherTool],
  systemPrompt:
    "你只处理天气。用户提到城市时，用 lookup_weather 查询后再用中文简短说明。",
});

/** 子代理 B：只回答「城市小知识」 */
const triviaAgent = createAgent({
  name: "trivia_agent",
  description: "专门讲与城市相关的小知识；必须调用 lookup_city_trivia。",
  model,
  tools: [lookupCityTriviaTool],
  systemPrompt:
    "你只讲城市小知识。先 lookup_city_trivia，再用人话转述，不要编造工具里没有的内容。",
});

/**
 * Supervisor：根据用户问的是「天气」还是「小知识」切换子代理。
 * （真实业务里还可以再加更多子代理，思路一样。）
 */
const workflow = createSupervisor({
  agents: [weatherAgent.graph, triviaAgent.graph],
  llm: model,
  addHandoffMessages: false,
  prompt: `你是调度员，只负责选人，不要自己报气温、也不要自己讲城市百科。

- 问天气、气温、下不下雨、空气 → 用 weather_agent
- 问小知识、名胜、历史、一句介绍 → 用 trivia_agent

重要规则：
- 每轮最多只能调用一个代理，禁止在同一条回复中同时调用多个 transfer_to_* 工具。
- 如果用户同时提出多个任务，先调用 weather_agent，等待它返回后再调用 trivia_agent。
- 所有任务完成后直接给出最终答复，不要再次调用已经完成任务的代理。
  `,
});

const app = workflow.compile();

const drawable = await app.getGraphAsync();
console.log(drawable.drawMermaid({ withStyles: true }));

const input = {
  messages: [
    new HumanMessage("查一下杭州的天气，再讲一条和杭州有关的小知识。"),
  ],
};

const nodePath = [];
let finalState = null;
const stream = await app.stream(input, { streamMode: ["updates", "values"] });
for await (const event of stream) {
  const [mode, payload] = event;
  if (mode === "updates" && payload && typeof payload === "object") {
    nodePath.push(...Object.keys(payload));
  } else if (mode === "values") {
    finalState = payload;
  }
}

console.log("路径:", nodePath.join(" → "));
const last = finalState?.messages?.at(-1);
console.log(last?.content ?? finalState?.messages);
