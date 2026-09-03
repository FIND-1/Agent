import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { createAgent, HumanMessage } from "langchain";
import { createFilesystemMiddleware, FilesystemBackend } from "deepagents";
import {
  resetDirectory,
  resolveFromModule,
  writeTextFile,
} from "../_shared/filesystem.mjs";

/**
 * 复习定位：从自定义 middleware 进入 DeepAgents 预置能力，给 Agent 挂载受控虚拟文件系统。
 * 本例重点是 backend、虚拟路径与 permissions 的配合；运行时会重建 workspace 目录。
 * 依赖模型 API，权限结果还取决于模型是否按提示调用指定文件工具。
 */

const workspaceDir = resolveFromModule(import.meta.url, "workspace");

/** 先匹配先生效；未命中任何规则则默认允许 */
const permissions = [
  { operations: ["read"], paths: ["/secret.txt"], mode: "deny" },
  { operations: ["write"], paths: ["/todo.md"], mode: "allow" },
  { operations: ["write"], paths: ["/**"], mode: "deny" },
];

resetDirectory(workspaceDir);
writeTextFile(workspaceDir, "secret.txt", "机密：不得读取");

const model = createChatModel();

const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "工作区根路径为 /。用 ls、read_file、write_file、edit_file 操作文件，路径以 / 开头。中文回答。",
  middleware: [
    createFilesystemMiddleware({
      backend: new FilesystemBackend({
        rootDir: workspaceDir,
        virtualMode: true,
      }),
      permissions,
    }),
  ],
});

console.log("工作区:", workspaceDir);
console.log("权限:", JSON.stringify(permissions, null, 2));

async function run(label, prompt) {
  console.log(`\n=== ${label} ===\n`, prompt, "\n");
  const { messages } = await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { recursionLimit: 20 },
  );
  for (const m of messages) {
    for (const t of m.tool_calls ?? []) console.log("→", t.name);
  }
  console.log("回复:", messages.at(-1)?.content);
}

async function expectDenied(label, prompt) {
  console.log(`\n=== ${label}（预期拒绝）===\n`, prompt, "\n");
  try {
    await agent.invoke(
      { messages: [new HumanMessage(prompt)] },
      { recursionLimit: 5 },
    );
    console.log("未触发拒绝（异常）");
  } catch (e) {
    const msg = e.cause?.message ?? e.message;
    console.log("✗", msg);
  }
}

await run(
  "允许的操作",
  "write_file 创建 /todo.md（三条待办），edit_file 把第一条标为完成，ls /，一句话总结。",
);

await expectDenied("禁止读", "只调用 read_file，路径 /secret.txt。");
await expectDenied("禁止写", "只调用 write_file，路径 /hack.txt，内容 test。");
