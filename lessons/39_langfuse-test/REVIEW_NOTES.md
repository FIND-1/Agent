# Lesson 39 复习记录

## 文章主线

文章先比较 LangSmith 与 Langfuse 的定位，再演示 Langfuse Cloud 接入，随后介绍 OpenTelemetry tracing、Agent 评估和自部署架构。当前代码对应关系如下：

| 文章知识点 | 代码位置 | 复习重点 |
| --- | --- | --- |
| DeepAgents 示例 | `src/_shared/agent.mjs` | 模型、天气工具、计算器工具和中文 system prompt |
| OpenTelemetry 埋点 | `src/_shared/instrumentation.mjs` | `NodeSDK`、`LangfuseSpanProcessor`、`immediate` 导出和 shutdown |
| tracing | `src/00-index.mjs` | `CallbackHandler` 如何通过 callbacks 接入 Agent |
| Dataset / Experiment / Evaluator | `src/01-evaluate.mjs` | 数据集种子、task、item-level evaluator、run-level evaluator |
| Cloud / 自部署 | `README.md` | 环境变量切换方式和 Docker/数据库外部前置条件 |

文章正文没有给出完整代码输出，因此这些实现按文章描述的上下文补齐；示例使用内存工具，避免引入文章未要求的业务功能。

## 本轮整理

- 将学习顺序整理为“共享 Agent 与基础设施 → `00-index.mjs` tracing → `01-evaluate.mjs` 评测”。
- 将原有 `agent.mjs`、`instrumentation.mjs` 移到 `_shared/`，因为它们被两个入口共同使用。
- 将原有 `index.mjs`、`evaluate.mjs` 分别映射到 `00-index.mjs`、`01-evaluate.mjs`。
- 保留 `src/index.mjs` 兼容旧命令，并在 README 说明它转发到编号入口。
- 为 lesson `package.json` 增加 `check`、`trace`、`evaluate` 脚本；依赖仍统一安装在仓库根目录。
- 为核心文件补充复习型注释，没有删除原有有效注释。

## 文件顺序与例外

按名称升序，学习主线文件为：

```text
src/00-index.mjs
src/01-evaluate.mjs
src/_shared/agent.mjs
src/_shared/instrumentation.mjs
src/index.mjs
```

`src/index.mjs` 是为兼容此前使用的原入口命令而保留的未编号文件；`src/_shared/` 是公共模块目录；`package.json`、README 和 REVIEW_NOTES 不参与编号。没有独立完整应用目录。

## 依赖与验证边界

- 无需 API Key：所有 `node --check` 语法检查；共享模块可静态阅读。
- 需要模型 API 与 Langfuse Key：`src/00-index.mjs`。
- 需要模型 API、Langfuse API 和网络：`src/01-evaluate.mjs`。
- 不需要数据库或 Docker：本课程的天气和计算器工具是内存模拟。
- 文章中的 Docker Compose 自部署属于外部前置条件，当前项目没有 Docker、数据库和持久化服务，未执行或宣称验证该链路。

## 共享抽离检查

本课重复使用的模型初始化、Agent 工厂、回复提取和 tracing shutdown 已集中到 `src/_shared/agent.mjs` 与 `src/_shared/instrumentation.mjs`。没有继续创建 schema、examples 或 prompt 工具模块，因为它们只在当前 Agent 示例中出现一次。没有跨 lesson 新增共享抽离；现有 `lessons/_shared/model.mjs` 已被复用。

编号入口不再 import 另一个编号入口：`00-index.mjs` 和 `01-evaluate.mjs` 都从 `_shared/` 引入公共模块。

## 复习建议

先读 `agent.mjs` 中的两个工具和 `createDeepAgent`，再读 instrumentation 的初始化时机，接着跟踪 `CallbackHandler` 如何挂载到 `agent.invoke`。最后阅读评测脚本，重点理解 Dataset item、task 输出、item-level evaluator 与 run-level evaluator 的数据流。外部服务不可用时，执行 `pnpm --filter 39_langfuse-test run check` 并沿这条调用链阅读即可。
