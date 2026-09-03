# DeepAgents Middleware 学习代码包

本课程对应文章《DeepAgents：开箱即用的 skill、上下文压缩等 middleware》。学习顺序分为两个阶段：先理解 LangChain `createAgent` 的 middleware 扩展机制，再学习 DeepAgents 提供的文件系统、skills、subagent、长期记忆和上下文压缩能力。

## 目录结构

```text
src/
  _shared/
    filesystem.mjs
  00_middleware/
    00-middleware-test.mjs
    01-middleware-test2.mjs
  01_deepagents/
    00-filesystem-agent.mjs
    01-skills-agent.mjs
    02-subagent-agent.mjs
    03-memory-agent.mjs
    04-summarization-agent.mjs
    output/
    workspace/
    workspace-memory/
    workspace-summarization/
```

## 原文路径映射

排序只增加阶段目录和数字前缀，原文 basename 主体保持不变。

| 顺序 | 原文路径                                 | 整理后路径                                     | 学习目的                                      |
| ---- | ---------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| 00   | `src/middleware-test.mjs`                | `src/00_middleware/00-middleware-test.mjs`     | 生命周期钩子、state、模型调用包装与提前结束   |
| 01   | `src/middleware-test2.mjs`               | `src/00_middleware/01-middleware-test2.mjs`    | middleware 注册工具、包装工具调用并更新 state |
| 02   | `src/deepagents/filesystem-agent.mjs`    | `src/01_deepagents/00-filesystem-agent.mjs`    | 虚拟文件系统、backend 和权限规则              |
| 03   | `src/deepagents/skills-agent.mjs`        | `src/01_deepagents/01-skills-agent.mjs`        | 按需读取 `SKILL.md` 并生成文件产物            |
| 04   | `src/deepagents/subagent-agent.mjs`      | `src/01_deepagents/02-subagent-agent.mjs`      | 主 Agent 委派解题、讲题和出题子 Agent         |
| 05   | `src/deepagents/memory-agent.mjs`        | `src/01_deepagents/03-memory-agent.mjs`        | 从 Markdown 注入并更新长期记忆                |
| 06   | `src/deepagents/summarization-agent.mjs` | `src/01_deepagents/04-summarization-agent.mjs` | 超过阈值后压缩旧消息并保留近期上下文          |

## 公共能力

- `@lessons/shared/env-loader`：统一从仓库根目录 `.env` 加载环境变量。
- `@lessons/shared/model`：统一创建模型并解析流式 chunk。
- `src/_shared/filesystem.mjs`：集中处理本 lesson 的宿主路径解析、目录重建、文本读写和文件枚举。

文件系统 helper 目前只在本 lesson 使用，因此按项目规则保留在 lesson 的 `_shared/`，不扩散到 `lessons/_shared`。

## 环境变量

所有变量来自仓库根目录 `.env`：

```dotenv
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
MODEL_NAME=...

# 可选：需要 LangSmith trace 时配置
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=deepagents-test
LANGCHAIN_TRACING_V2=true
```

不要把 API Key 写入源码、Markdown 记忆文件或 Git。

## 运行方式

依赖由仓库根工作区统一安装。不要在 lesson 目录执行 `pnpm install`。

```bash
cd lessons/30_deepagents_test
```

### 1. 语法检查

无需 API Key，不会调用模型：

```bash
node --check src/_shared/filesystem.mjs
node --check src/00_middleware/00-middleware-test.mjs
node --check src/00_middleware/01-middleware-test2.mjs
node --check src/01_deepagents/00-filesystem-agent.mjs
node --check src/01_deepagents/01-skills-agent.mjs
node --check src/01_deepagents/02-subagent-agent.mjs
node --check src/01_deepagents/03-memory-agent.mjs
node --check src/01_deepagents/04-summarization-agent.mjs
```

### 2. 需要模型 API

```bash
node src/00_middleware/00-middleware-test.mjs
node src/00_middleware/01-middleware-test2.mjs
node src/01_deepagents/02-subagent-agent.mjs
```

常见失败原因：根 `.env` 缺少模型配置、兼容接口不支持工具调用、模型没有按提示选择工具，或递归上限不足。

### 3. 需要模型 API 和本地文件能力

```bash
node src/01_deepagents/00-filesystem-agent.mjs
node src/01_deepagents/03-memory-agent.mjs
node src/01_deepagents/04-summarization-agent.mjs
```

filesystem 和 summarization 示例会清理各自的演示 workspace；memory 示例会更新 Markdown 记忆文件。不要在这些目录存放真实资料。

### 4. 需要额外 skill

```bash
node src/01_deepagents/01-skills-agent.mjs
```

该入口要求 `.agents/skills/excalidraw-diagram-generator/SKILL.md` 存在，并会写入 `src/01_deepagents/output/`。当前课程包已经包含该 skill。

### 5. 无需 API Key 可运行

本课程没有完整的无模型业务入口。没有 API Key 时先执行语法检查，再静态阅读每个 `createAgent` 的 `middleware` 数组。

## 外部能力不可用时怎么复习

- 模型不支持工具调用：重点追踪工具注册位置和 `wrapToolCall` / `task` 数据流。
- skill 无法执行：阅读 `sources`、backend 和 middleware 顺序，并查看已有 `.excalidraw` 产物。
- LangSmith 不可用：不影响本地结构复习，只是看不到 trace 上报。
- 模型没有严格委派或触发摘要：先确认这是模型行为差异，不要误判为语法错误。

## 关键结论

- middleware 可以在 Agent、模型和工具调用前后插入逻辑，也能扩展 state、工具或提前结束流程。
- `FilesystemMiddleware` 将统一文件工具和 backend 解耦，permissions 负责限制虚拟路径操作。
- `SkillsMiddleware` 让 Agent 按需读取技能说明，不需要把全部技能内容预先塞进 system prompt。
- `SubAgentMiddleware` 适合把复杂任务拆给角色明确、工具受限的子 Agent。
- `MemoryMiddleware` 保存跨轮次长期事实；`SummarizationMiddleware` 压缩当前长对话，两者职责不同。
- DeepAgents 是 LangGraph 生态上的高阶封装；需要完全控制状态和路由时仍应直接使用 LangGraph。

完整整理依据和自检记录见 `REVIEW_NOTES.md`。
