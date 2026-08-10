# LangGraph 图编排与多 Agent

这套示例把文章的知识主线整理为一条可执行路径：先理解 `StateGraph`，再学习分支、循环、状态持久化和人工中断，最后进入工具型 Agent 与 Supervisor–Worker 多 Agent 架构。

## 一周后如何快速复习

| 顺序 | 文件                                | 解决的问题                        | API Key | 外部服务       |
| ---- | ----------------------------------- | --------------------------------- | ------- | -------------- |
| 00   | `src/00-basic-graph.mjs`            | State、Node、Edge 如何组成最小图  | 不需要  | 无             |
| 01   | `src/01-conditional-routing.mjs`    | 如何根据 state 选择分支           | 不需要  | 无             |
| 02   | `src/02-loop-retry.mjs`             | 如何用回边实现重试循环            | 不需要  | 无             |
| 03   | `src/03-checkpointer-memory.mjs`    | 如何按 `thread_id` 记住会话状态   | 不需要  | 无             |
| 04   | `src/04-checkpointer-sqlite.mjs`    | 如何把状态保存到本地 SQLite 文件  | 不需要  | 无远程服务     |
| 05   | `src/05-graph-interrupt.mjs`        | 如何暂停并由用户输入恢复          | 不需要  | 无，需终端交互 |
| 06   | `src/06-prebuilt-tool-node.mjs`     | 如何手写 model–tool agent loop    | 需要    | 模型 API       |
| 07   | `src/07-prebuilt-agent.mjs`         | 如何用 `createAgent` 封装常见循环 | 需要    | 模型 API       |
| 08   | `src/08-multi-agent-supervisor.mjs` | 如何由 Supervisor 调度多个 Worker | 需要    | 模型 API       |

推荐先依次运行 00–04，再阅读 05 的中断/恢复过程，最后对照 06 与 07，理解 `createAgent` 隐藏了什么。08 是整篇文章的落点。

## 运行方式

依赖统一安装在项目根目录，不要在本 lesson 内创建 `node_modules`：

```powershell
# From the repository root:
pnpm install
```

### 1. 语法检查

```powershell
npm --prefix lessons/23_langgraph-test run check
```

### 2. 无需 API Key

```powershell
npm --prefix lessons/23_langgraph-test run demo:basic
npm --prefix lessons/23_langgraph-test run demo:routing
npm --prefix lessons/23_langgraph-test run demo:loop
npm --prefix lessons/23_langgraph-test run demo:memory
npm --prefix lessons/23_langgraph-test run demo:sqlite
npm --prefix lessons/23_langgraph-test run demo:interrupt
```

`demo:interrupt` 会等待终端输入。`demo:sqlite` 会在 `src/_shared/` 生成本地数据库文件，并在每次运行前清空旧演示状态，使输出可重复。

### 3. 需要模型 API

06–08 通过项目共享的 `createChatModel()` 读取项目根目录的 `.env`：

```dotenv
OPENAI_API_KEY=你的密钥
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
```

```powershell
npm --prefix lessons/23_langgraph-test run demo:tool-node
npm --prefix lessons/23_langgraph-test run demo:agent
npm --prefix lessons/23_langgraph-test run demo:supervisor
```

常见失败原因：密钥或兼容接口地址错误、模型不支持工具调用、余额/限流问题，以及模型没有稳定遵守 Supervisor 的 handoff 约束。

### 4. 外部服务

本 lesson 不依赖 Docker、MySQL、Redis 或真实天气/库存接口。SQLite 示例使用进程内可访问的本地文件；库存与城市数据均为 `_shared/` 中的假数据。

### 5. Fallback 复习路径

没有模型配置时，00–05 仍能覆盖 LangGraph 的图、路由、循环、检查点和中断。06–08 可先静态阅读其 Mermaid 导出与节点连线：重点比较 06 的显式 `ToolNode` 循环、07 的 `createAgent` 封装，以及 08 的 Supervisor → Worker handoff。模拟数据已经消除了真实业务 API 依赖，但模型驱动的路由本身无法在无 API Key 时真实复现。

## 核心结论

- LangGraph 在 LangChain 组件之上提供图编排：节点处理状态，边决定执行路径，`compile()` 后才能调用。
- `Annotation` 定义状态字段、默认值和 reducer；节点应返回“状态更新”，而不是任意修改共享对象。
- `addConditionalEdges` 同时支撑分支和循环；真实重试必须额外考虑次数上限与退避。
- Checkpointer 通过 `thread_id` 隔离会话；`MemorySaver` 适合演示，本地 SQLite 展示跨进程持久化思路。
- `interrupt` 与 `Command({ resume })` 让图支持 Human-in-the-loop，前提是使用同一检查点和 `thread_id`。
- `ToolNode` + `toolsCondition` 是常见 agent loop；`createAgent` 是这类图的高层入口。
- Supervisor–Worker 能让每个 Worker 只携带职责相关的工具和提示词，也能组织并行/协作；但它并不保证总 token 一定更少，收益取决于调度次数、上下文设计和任务结构。

更完整的文章—代码对齐、整理决策和坑点见 `REVIEW_NOTES.md`。
