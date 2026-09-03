import "@lessons/shared/env-loader";
import { createChatModel, getChunkText } from "@lessons/shared/model";
import { createAgent, HumanMessage } from "langchain";
import {
  LocalShellBackend,
  createFilesystemMiddleware,
  createSkillsMiddleware,
} from "deepagents";
import { ensureDirectory, pathExists } from "../_shared/filesystem.mjs";

/**
 * 复习定位：在 FilesystemMiddleware 基础上叠加 SkillsMiddleware，让 Agent 按需读取 SKILL.md。
 * 本例还通过 LocalShellBackend 将 skill 与产物目录映射到 lesson 工作区，并流式观察模型和工具事件。
 * 依赖模型 API、已安装的 Excalidraw skill；生成质量与耗时受模型能力影响。
 */

const skills = "/.agents/skills/";
const output = "src/01_deepagents/output/deepagents-skills-flow.excalidraw";

if (!pathExists(".agents/skills/excalidraw-diagram-generator/SKILL.md")) {
  throw new Error(
    "未找到 excalidraw-diagram-generator，请先: npx skills add github/awesome-copilot --skill excalidraw-diagram-generator -y",
  );
}

ensureDirectory("src/01_deepagents/output");

const model = createChatModel({ streaming: true });

const backend = await LocalShellBackend.create({
  rootDir: ".",
  virtualMode: true,
  inheritEnv: true,
});

const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "按 skills 库完成任务，需要时 read_file 对应 SKILL.md。中文回答。",
  middleware: [
    createSkillsMiddleware({ backend, sources: [skills] }),
    createFilesystemMiddleware({ backend }),
  ],
});

const prompt = [
  "画一张流程图，描述本项目的 skills-agent 工作流：",
  "用户 Prompt → createAgent → createSkillsMiddleware → createFilesystemMiddleware → 模型回复。",
  `保存为 ${output}。要求：`,
  "- 顶部大标题 + 副标题",
  "- 每个主节点 numbered（①②…）且框内 2～3 行中文说明",
  "- 右侧一列「说明：…」补充细节",
  "- 箭头上标注阶段名（如 invoke、wrapModelCall）",
  "- 底部图例（颜色含义 + 如何运行 demo）",
].join("\n");

console.log("用户:", prompt);

const stream = await agent.streamEvents(
  { messages: [new HumanMessage(prompt)] },
  { recursionLimit: 100 },
);

let skillsMetadata;
console.log("\n--- 流式输出 ---\n");

try {
  for await (const event of stream) {
    if (event.event === "on_chat_model_stream") {
      const text = getChunkText(event.data?.chunk ?? {});
      if (text) process.stdout.write(text);
    }
    if (event.event === "on_tool_start") {
      const name = event.name?.split("/").pop() ?? event.name;
      process.stdout.write(`\n\n→ ${name}\n\n`);
    }
    if (event.event === "on_chain_end" && event.data?.output?.skillsMetadata) {
      skillsMetadata = event.data.output.skillsMetadata;
    }
  }
} catch (e) {
  console.error("\n\n[错误]", e.cause?.message ?? e.message);
  throw e;
}

console.log("\n");
console.log(
  "skills:",
  skillsMetadata?.map((s) => s.name),
);
if (pathExists(output)) {
  console.log("图表:", output);
  console.log("打开: https://excalidraw.com → Open → 选择该文件");
} else {
  console.log("未生成:", output);
}

await backend.close();
