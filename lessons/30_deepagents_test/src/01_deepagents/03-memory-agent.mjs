import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { createAgent, HumanMessage } from "langchain";
import {
  createFilesystemMiddleware,
  createMemoryMiddleware,
  FilesystemBackend,
} from "deepagents";
import { readTextFile, resolveFromModule } from "../_shared/filesystem.mjs";

const workspaceDir = resolveFromModule(import.meta.url, "workspace-memory");
const projectMemoryPath = "/AGENTS.md";
const preferencesMemoryPath = "/memory/preferences.md";

/**
 * 复习定位：在文件系统能力之上增加长期记忆，把项目事实和个人偏好分别保存在 Markdown 中。
 * 相比普通对话历史，MemoryMiddleware 会在调用模型前注入指定文件内容，并允许 Agent 持久化更新。
 * 依赖模型 API；运行会真实修改 workspace-memory 下的学习数据，复习前应先查看初始文件。
 */

for (const name of ["OPENAI_API_KEY", "OPENAI_BASE_URL", "MODEL_NAME"]) {
  if (!process.env[name]) {
    throw new Error(`根目录 .env 缺少 ${name}，无法创建 ChatModel`);
  }
}

const model = createChatModel();

console.log("模型:", process.env.MODEL_NAME);
console.log("Base URL:", process.env.OPENAI_BASE_URL);

const backend = new FilesystemBackend({
  rootDir: workspaceDir,
  virtualMode: true,
});

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: [
    "你是项目助手。工作区根路径为 /，可用 ls、read_file、write_file、edit_file。",
    "根据 <agent_memory> 回答；用户要求记住时，必须立刻 edit_file，且按类型写入对应文件：",
    `- ${projectMemoryPath}：项目说明、技术栈、架构、仓库约定等`,
    `- ${preferencesMemoryPath}：用户个人偏好（语言、包管理器、回答风格等）`,
    "不要混写：项目事实不要写入 preferences，个人偏好不要写入 AGENTS.md。",
  ].join("\n"),
  middleware: [
    createFilesystemMiddleware({ backend }),
    createMemoryMiddleware({
      backend,
      sources: [projectMemoryPath, preferencesMemoryPath],
    }),
  ],
});

const prompts = [
  "根据记忆，这个项目是做什么的？只答一句。",
  `请记住：我常用的包管理器是 pnpm。`,
  `请记住：本仓库主入口脚本是 src/01_deepagents/03-memory-agent.mjs。`,
  "我常用什么包管理器？本 demo 主入口脚本路径是什么？各用一行回答。",
];

let messages = [];

for (const prompt of prompts) {
  console.log("\n用户:", prompt);
  ({ messages } = await agent.invoke(
    { messages: [...messages, new HumanMessage(prompt)] },
    { recursionLimit: 30 },
  ));
  console.log("回复:", messages.at(-1)?.content);
}

for (const p of [projectMemoryPath, preferencesMemoryPath]) {
  console.log(
    `\n--- ${p} ---\n`,
    readTextFile(workspaceDir, p.replace(/^\//, "")),
  );
}
