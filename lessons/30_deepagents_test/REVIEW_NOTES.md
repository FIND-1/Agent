# DeepAgents Middleware 复习记录

## 文章主线

文章从“复杂 Agent 全部从 LangGraph 底层搭建成本较高”出发，先用两个 LangChain 自定义 middleware 示例说明扩展机制，再依次引入 DeepAgents 的 filesystem、skills、subagent、memory 和 summarization middleware。

学习终点不是记忆 API 名称，而是能够根据复杂 Agent 的需求选择合适能力，并说明 middleware 在模型调用、工具调用、状态更新和上下文管理中的位置。

## 排序结果

| 阶段                         | 整理后入口                                     | 原文入口                                 |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------- |
| 00 LangChain middleware 基础 | `src/00_middleware/00-middleware-test.mjs`     | `src/middleware-test.mjs`                |
| 00 LangChain middleware 基础 | `src/00_middleware/01-middleware-test2.mjs`    | `src/middleware-test2.mjs`               |
| 01 DeepAgents                | `src/01_deepagents/00-filesystem-agent.mjs`    | `src/deepagents/filesystem-agent.mjs`    |
| 01 DeepAgents                | `src/01_deepagents/01-skills-agent.mjs`        | `src/deepagents/skills-agent.mjs`        |
| 01 DeepAgents                | `src/01_deepagents/02-subagent-agent.mjs`      | `src/deepagents/subagent-agent.mjs`      |
| 01 DeepAgents                | `src/01_deepagents/03-memory-agent.mjs`        | `src/deepagents/memory-agent.mjs`        |
| 01 DeepAgents                | `src/01_deepagents/04-summarization-agent.mjs` | `src/deepagents/summarization-agent.mjs` |

排序前缀只表达学习顺序，没有改变原文 basename 的语义主体。配套 workspace 和 output 随 DeepAgents 阶段一起移动，避免资源目录与入口分离。

## 公共代码抽离

### 仓库级共享

- 模型初始化、根 `.env` 加载和流式 chunk 解析已在超过 3 个 lesson 中复用，继续使用 `@lessons/shared/model` 与 `@lessons/shared/env-loader`。
- skills 和 subagent 示例原有的重复 `chunkText` 已统一改为 `getChunkText`。

### Lesson 级共享

filesystem、memory 和 summarization 示例重复导入并组合 `node:fs`、`node:path`、`fileURLToPath`。这些代码只是宿主工作区准备逻辑，不是 middleware 教学重点，因此提取为：

```text
src/_shared/filesystem.mjs
```

它统一提供模块目录解析、普通路径拼接、目录创建与重建、文本读写和文件枚举。skills 示例也复用了其中的目录和存在性检查。

该能力目前只在 `30_deepagents_test` 使用，没有达到超过 3 个 lesson 的跨课程抽离阈值，因此不加入 `lessons/_shared`。

## 其他整理

- 修复第二个 middleware 示例中的富文本复制语法错误。
- 为 7 个核心入口补充复习型注释，说明当前问题、相较前例的新增能力和运行局限。
- 为 skills 和 subagent 示例恢复流式模型配置。
- `package.json` 的 check 和 demo 脚本已切换到排序后路径。
- 删除未被代码引用的旧 `src/workspace-memory` 副本。
- 清理 lesson 内独立 `node_modules`，依赖继续由根工作区维护。
- 根 `pnpm-lock.yaml` 已同步当前 lesson 的直接依赖。

## 推荐复习顺序

1. `00_middleware/00-middleware-test.mjs`：middleware 生命周期、state 和短路。
2. `00_middleware/01-middleware-test2.mjs`：工具注入、包装和 `Command` 状态更新。
3. `01_deepagents/00-filesystem-agent.mjs`：宿主目录、虚拟路径和 permissions。
4. `01_deepagents/01-skills-agent.mjs`：skill 发现、读取和产物写入。
5. `01_deepagents/02-subagent-agent.mjs`：主 Agent 编排与子 Agent 工具边界。
6. `01_deepagents/03-memory-agent.mjs`：项目事实与个人偏好两个长期记忆源。
7. `01_deepagents/04-summarization-agent.mjs`：摘要触发、近期消息保留和历史文件。

## 依赖与副作用

- 所有业务示例都需要根 `.env` 中的模型 API 配置。
- LangSmith 是可选观测能力，不是本地结构检查的必要条件。
- filesystem 示例会重建 `src/01_deepagents/workspace`。
- memory 示例会更新 `src/01_deepagents/workspace-memory`。
- summarization 示例会重建 `src/01_deepagents/workspace-summarization`。
- skills 示例可能覆盖 `src/01_deepagents/output` 中的同名 Excalidraw 文件。

## 原文差异与更正

- 原文文件存在富文本粘贴导致的语法错误，已按原意修复，核心逻辑未改写。
- 原文每个文件直接创建 `ChatOpenAI`；仓库已形成跨课程模型工厂，因此使用共享 `createChatModel()`。
- 原文使用 `dotenv/config`；当前统一使用根目录 env loader，避免工作目录不同导致读取不同 `.env`。
- 原文说明 summarization 有多种触发方式，当前只保留文章实际实现的 messages 数量阈值，没有擅自新增示例。
- summarization 测试数据与文章展示值不同，只是演示输入变化，不影响 middleware 知识点。

## 自检项

- `_shared/`：包含实际被 4 个入口复用的 `filesystem.mjs`，不是空目录。
- 课程根 Markdown：仅 `README.md` 和 `REVIEW_NOTES.md`。
- 示例间 import：入口只 import `_shared` 或包，不 import 其他编号示例。
- 子课程依赖：最终状态不保留 lesson 级 `node_modules`。
- README：已按无需 API、模型 API、本地文件能力和额外 skill 分类。
- fallback：未新增原文外示例，已提供静态降级复习路径。
- 原文注释：有效信息保留，新增说明未替换原注释。
- 运行检查：以本轮最终 `node --check` 和 import 检查结果为准；不调用模型、不启动服务。
