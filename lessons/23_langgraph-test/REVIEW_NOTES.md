# LangGraph 复习记录

## 这篇文章想教会什么

文章从“为什么复杂 Agent 常采用多 Agent 架构”出发：单 Agent 容易携带过多无关工具和提示词，只能顺序处理，并且自我反思的纠错视角有限。随后用 LangGraph 建立图编排基础，依次加入分支、循环、检查点和人工中断，再讲解预构建工具节点与 `createAgent`，最终落到 Supervisor–Worker 多 Agent 调度。

可压缩为一条主线：

```text
固定图 → 条件分支 → 循环 → 会话状态 → 持久化 → 人工中断
     → 手写 agent loop → createAgent → Supervisor + Workers
```

文章关于多 Agent 的三个主要判断被保留：职责隔离可减少无关上下文干扰；多个 Worker 可以组织并行处理；不同角色可以相互补充和纠错。复习时要加一个工程 caveat：多 Agent 会增加模型调用与调度开销，因此“更省 token、更准确”是可能收益，不是无条件保证。

## 文章与代码对应关系

1. `00-basic-graph.mjs` 补回原稿中的第一个 `StateGraph`，明确 `START → step1 → step2 → END`。
2. `01-conditional-routing.mjs` 对应 `addConditionalEdges` 的 math/chat 分支。
3. `02-loop-retry.mjs` 对应用条件边回到原节点的重试循环。
4. `03-checkpointer-memory.mjs` 对应 `MemorySaver` 与不同 `thread_id` 的状态隔离。
5. `04-checkpointer-sqlite.mjs` 是现有代码对文章持久化说明的补充，用本地 SQLite 展示跨进程保存思路。
6. `05-graph-interrupt.mjs` 对应 `interrupt` 暂停与 `Command({ resume })` 恢复。
7. `06-prebuilt-tool-node.mjs` 对应 `ToolNode` + `toolsCondition` 手写工具调用循环。
8. `07-prebuilt-agent.mjs` 对应 `createAgent` 对常用 agent loop 的封装。
9. `08-multi-agent-supervisor.mjs` 对应 Supervisor–Worker 架构，并额外打印流经的节点路径。

## 本次结构调整

- 为九个核心示例增加 `00`–`08` 编号，文件名直接表达学习目的。
- 补充缺失的基础图示例，避免课程从条件路由突然开始。
- 把库存假接口和城市假接口移入 `src/_shared/`；编号示例不再承担公共模块职责。
- 统一 import 空格、缩进、分号和不可见不间断空格。
- 每个核心示例增加复习型头注释，说明问题、适用场景、相对前例的增量以及局限/依赖。
- 补充 lesson `package.json` 的最小依赖声明与运行脚本；依赖仍由根工作区统一安装。

## `_shared/` 抽离结果

- `_shared/inventory.mjs`：06、07 共用的库存数据与查询函数。
- `_shared/city-data.mjs`：08 的两个 Worker 共用的天气和城市知识假接口。

检查过模型初始化、环境变量、schema、examples、prompt 和工具函数：模型初始化只在 06–08 使用，且已统一调用项目级 `@lessons/shared/model`；两个库存示例的重复 schema 很短，并分别服务 `@langchain/core/tools` 与 `langchain` 两种导入入口，保留在示例中更便于直接对照；Supervisor 的两个 schema、工具和 prompt 表达不同职责，不适合为减少行数而隐藏到共享文件。没有 examples 重复，也没有编号示例互相 import。

## 依赖与 fallback

- 00–04：无 API Key，可直接运行。
- 05：无 API Key，但需要人工终端输入。
- 06–08：需要根目录 `.env` 中的模型 API 配置。
- 外部服务：无。SQLite 是本地文件，不需要数据库服务；天气和库存均使用假接口。
- Fallback：没有模型时运行 00–05，并静态对照 06/07/08 的图结构与 API 分层。

## 后续复习坑点

- `thread_id` 不是普通业务字段，而是 Checkpointer 找到同一会话的关键配置；恢复时必须复用它。
- reducer 决定并发或连续更新如何合并。当前示例用“后值覆盖前值”，消息状态则使用 `MessagesAnnotation` 的专用合并逻辑。
- 条件循环若没有退出条件会触发递归上限；生产重试还应加入最大次数、退避和可重试错误判断。
- 01 使用 `eval` 仅为展示路由，不能接收不可信输入。
- 中断节点恢复时会从节点逻辑重新进入；中断前的副作用必须设计成幂等。
- `MemorySaver` 随进程结束而消失；本地 SQLite 也不等于生产数据库方案。
- `createAgent` 适合标准工具循环；需要自定义状态、审核点或复杂并行图时，应直接使用 `StateGraph`。
- Supervisor 的 handoff 是模型决策，输出路径可能受模型能力、提示词和版本影响。

## 自检记录

- 课程根目录仅保留 `README.md` 与 `REVIEW_NOTES.md` 两份 Markdown。
- `_shared/` 非空；编号示例不互相 import。
- lesson 内不应存在 `node_modules`，依赖由根目录工作区管理。
- README 已按语法检查、无 API、模型 API、外部服务和 fallback 分类。
- SQLite 示例不是已配置的外部数据库；未声称验证 Docker、MySQL 或 Redis。
- 实际语法与运行检查结果以本次交付回复为准。
