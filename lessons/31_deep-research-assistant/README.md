# DeepAgents 深度调研助手

目标是理解如何用 `createDeepAgent` 组合文件系统、skills、todo、子 Agent、联网搜索和 QuickJS 代码解释器，完成“规划 -> 调研 -> 分析 -> 起草 -> 审阅 -> 定稿”的深度调研流程。

## 先看什么

源码目录保持文章原有的扁平结构，不新增阶段目录。排序直接通过文件名前缀表达，原文件名主体仍可辨认。主 Agent 的 4 个角色不是 4 个独立文件：主 Agent 在 `src/01-agent.mjs` 中编排，`researcher`、`analyst`、`editor` 以 subagent 配置存在。

```text
lessons/31_deep-research-assistant/
  README.md
  REVIEW_NOTES.md
  AGENTS.md                         # 主 Agent 的长期记忆
  skills/
    web-research/SKILL.md            # 联网调研流程
    report-writer/SKILL.md           # 报告撰写规范
  src/
    tools/00-search.mjs              # Bocha 联网搜索工具
    01-agent.mjs                     # createDeepAgent 与 3 个子 Agent
    02-cli.mjs                       # 流式事件和产物展示入口
    03-todo-middleware-test.mjs      # createAgent + todoListMiddleware 对照实验
    04-max-input-tokens-test.mjs     # 上下文压缩阈值配置实验
  workspace/
    sources/                          # question、research plan、findings、analysis
    reports/                          # 草稿和终稿示例
  conversation_history/              # 历史会话归档，供上下文压缩复习
```

## 推荐复习顺序

| 顺序 | 文件 | 学习目的 | API Key | 外部服务 |
| --- | --- | --- | --- | --- |
| 00 | `src/tools/00-search.mjs` | 理解 `tool`、Zod schema、Bocha 请求和结果格式化 | 需要 `BOCHA_API_KEY` 才能请求 | Bocha HTTP API |
| 01 | `src/01-agent.mjs` | 理解 `createDeepAgent`、`FilesystemBackend`、skills、memory 和 3 类 subagent | 需要模型 API | 模型 API；调研时还需要 Bocha |
| 02 | `src/02-cli.mjs` | 观察主 Agent / 子 Agent 的流式节点、文件工具、`eval` 和最终产物 | 需要模型 API | 模型 API；调研时还需要 Bocha |
| 03 | `src/03-todo-middleware-test.mjs` | 对照理解 `createAgent` + `todoListMiddleware` 如何读写 todo state | 需要模型 API | 模型 API |
| 04 | `src/04-max-input-tokens-test.mjs` | 理解通过 `model.profile.maxInputTokens` 影响上下文压缩阈值 | 不需要调用模型 | 无 |

配套阅读顺序：先读 `AGENTS.md`，再读 `skills/web-research/SKILL.md` 和 `skills/report-writer/SKILL.md`，最后查看 `workspace/sources/` 和 `workspace/reports/`，把文件传递链路串起来。

## 环境变量

统一从仓库根目录 `.env` 读取，不要在本 lesson 目录新增真实密钥文件：

```dotenv
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_MODEL=...

# createChatModel() 默认读取 MODEL_NAME；主 Agent 也兼容 OPENAI_MODEL
MODEL_NAME=...
DEEP_RESEARCH_MODEL_BASE_URL=...
RECURSION_LIMIT=300

BOCHA_API_KEY=...

# 可选：LangSmith 链路追踪
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=deep-research-assistant
LANGCHAIN_TRACING_V2=true
```

主 Agent 优先使用调用参数，其次读取 `OPENAI_MODEL` / `MODEL_NAME`；模型地址优先使用 `DEEP_RESEARCH_MODEL_BASE_URL`，再回退到 `OPENAI_BASE_URL`。`todo-middleware-test.mjs` 和 `max-input-tokens-test.mjs` 直接使用共享模型工厂的默认 `MODEL_NAME` 配置。

## 运行方式

依赖统一由仓库根工作区维护。不要在本目录执行 `pnpm install` 或生成独立 `node_modules`。

### 1. 语法检查

```powershell
npm run check
```

该命令只执行 `node --check`，不调用模型、不请求 Bocha，也不启动本地服务。

### 2. 无需 API Key 可运行

```powershell
npm run demo:context
```

该入口只构造模型对象并打印、覆盖 `profile.maxInputTokens`，用于理解配置方式，不会真正触发长对话摘要。

### 3. 需要外部 HTTP API

```powershell
npm run demo:search -- "2023年各省GDP排名"
```

需要根目录 `.env` 中的 `BOCHA_API_KEY`。常见失败原因是密钥缺失、接口地址不可达、返回 JSON 结构与当前解析逻辑不一致。

### 4. 需要模型 API

```powershell
npm run demo:agent -- "请用一句话介绍你自己"
npm run demo:todo
npm run demo:cli -- "调研一个主题"
```

`demo:agent` 是最小主 Agent 入口；`demo:cli` 适合观察完整流式过程。真正执行联网调研时还需要 `BOCHA_API_KEY`。`demo:todo` 会调用模型，不会使用 Bocha。

### 5. LangSmith 追踪

LangSmith 不是运行前置条件。只有配置 `LANGCHAIN_API_KEY`、`LANGCHAIN_PROJECT` 和 `LANGCHAIN_TRACING_V2=true` 后，才适合观察模型、工具、子 Agent 和上下文压缩的 trace。当前课程没有把云端 trace 当作已验证结果。

## 外部服务不可用时的复习路径

本课程没有数据库、Docker、Milvus 或其他本地服务依赖，也没有新增非原文 fallback 文件。没有模型或 Bocha 时，按下面顺序静态复习：

1. 看 `src/tools/00-search.mjs`，理解工具的输入 schema、鉴权、HTTP 请求和错误返回。
2. 看 `src/01-agent.mjs`，重点追踪 `createDeepAgent` 的 `backend`、`memory`、`skills` 和 `subagents` 配置。
3. 对照 `skills/web-research/SKILL.md`、`skills/report-writer/SKILL.md` 和 `AGENTS.md`，理解 prompt 规则如何分层注入。
4. 看 `src/02-cli.mjs`，把 `model_request -> tools -> task/eval/file tool` 事件流画出来。
5. 最后阅读 `workspace/sources/` 与 `workspace/reports/`，理解子 Agent 通过文件交接，而不是依赖对话历史。
6. 用 `src/03-todo-middleware-test.mjs` 和 `src/04-max-input-tokens-test.mjs` 补足 todo state 与上下文压缩两个横切能力。

## 关键结论

- `createDeepAgent` 是 DeepAgents 的高阶入口，将常用 middleware、文件系统、skills、长期记忆、todo 和 subagent 能力组合起来。
- 主 Agent 负责拆解和综合；`researcher` 只调研一个子主题，`analyst` 必须通过 QuickJS 计算，`editor` 只审阅不直接改稿。
- skills 是按需读取的 prompt 封装，`AGENTS.md` 是自动加载的长期记忆；二者分别解决流程知识和稳定偏好注入。
- 复杂任务应先写 todo 再执行，子 Agent 也可以拥有自己的局部 todo，但不要重复主 Agent 的总体计划。
- 涉及数字时应通过 `eval` / QuickJS 计算，不能让模型凭猜测生成数字。
- 上下文压缩依赖模型的 `profile.maxInputTokens`；兼容模型没有该值时，可以像 `max-input-tokens-test.mjs` 一样补充 profile。
- LangSmith 的 tool 过滤适合复盘工具调用顺序，但它只是观测能力，不改变 Agent 的业务流程。

## 常见问题

- `未设置 OPENAI_API_KEY`：检查根目录 `.env`，不要把 key 写进 lesson 文件。
- `Bocha 联网搜索的 API Key 未配置`：配置 `BOCHA_API_KEY`；没有它时可以跳过真实搜索，继续静态阅读工具和 findings 文件。
- `Recursion limit`：提高根 `.env` 的 `RECURSION_LIMIT`，同时检查模型是否重复调用工具或反复更新 todo。
- `ERR_MODULE_NOT_FOUND`：确认使用仓库根工作区依赖，并从仓库根完成依赖安装；不要在 lesson 内单独安装。
- 没有生成报告：先检查模型是否完成 `research_plan.md`、findings、草稿、编辑和终稿各阶段，以及 `workspace/` 的虚拟路径是否正确。

完整的文章对齐、排序依据、差异说明和自检记录见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。
