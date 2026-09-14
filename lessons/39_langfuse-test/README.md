# Lesson 39：Langfuse 观测与 Agent 评测

本课程把文章中的文字主线落成一个可复习的最小示例：先用 OpenTelemetry 把 Agent span 导出到 Langfuse，再用 Langfuse 的 Dataset、Experiment 和 Evaluator 评估同一个 Agent。天气查询和加法工具使用内存模拟数据，重点放在 tracing 与评测链路。

## 学习顺序

1. `src/_shared/agent.mjs`：阅读 DeepAgents、模型和两个工具的组合方式。
2. `src/_shared/instrumentation.mjs`：理解 OpenTelemetry 启动、Langfuse span processor 和短脚本 flush。
3. `src/00-index.mjs`：给 Agent 挂上 `CallbackHandler`，运行一次 tracing。
4. `src/01-evaluate.mjs`：创建或复用 Dataset，执行 Experiment，并写入关键词和非空结果分数。

`src/index.mjs` 是旧命令 `node src/index.mjs` 的兼容入口，实际转发到 `src/00-index.mjs`。编号示例之间不互相 import，公共逻辑统一放在 `src/_shared/`。

## 环境变量

所有变量都从项目根目录 `.env` 读取，不在本课程目录新增 `.env` 文件：

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-flash
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_DATASET_NAME=deepagents-eval
```

`OPENAI_BASE_URL` 必须和 `MODEL_NAME` 属于同一个 OpenAI 兼容服务。若使用当前 DeepSeek 端点，模型名应使用该端点支持的名称，例如 `deepseek-flash` 或 `deepseek-v4-pro`，不要使用 `gpt-4o-mini`。

## 运行与依赖分类

在仓库根目录安装依赖；lesson 的 `package.json` 只提供脚本，不单独维护依赖。

### 语法检查（无需 API Key）

```bash
pnpm --filter 39_langfuse-test run check
```

### 需要模型 API 和 Langfuse Key

```bash
cd lessons/39_langfuse-test
node src/00-index.mjs
# 或保留旧命令
node src/index.mjs
```

该示例会调用模型、执行模拟工具并上报 trace。

### 需要模型 API、Langfuse API 和网络

```bash
cd lessons/39_langfuse-test
node src/01-evaluate.mjs
```

该脚本会创建 Dataset 条目并运行 Experiment。它不依赖 MySQL、Redis、PostgreSQL、MinIO 或 ClickHouse。

### Cloud 与自部署边界

文章同时介绍 Langfuse Cloud 和 Docker Compose 自部署。当前仓库没有 Docker 编排或可运行的数据库环境，因此自部署步骤只作为外部前置条件保留，未宣称本地部署已验证。自建服务需要用户准备 Docker、PostgreSQL、Redis、MinIO、ClickHouse 等组件，并把 `LANGFUSE_BASE_URL` 指向自己的 Langfuse 服务。

## 常见报错

- `supported API model names ... but you passed gpt-4o-mini`：代码回退到了默认模型，检查根 `.env` 的 `MODEL_NAME`，并确认它是当前 `OPENAI_BASE_URL` 支持的模型。
- `ERR_MODULE_NOT_FOUND`：在仓库根目录执行 `pnpm install`，确认根 `package.json` 包含 `@langfuse/client`、`@langfuse/langchain`、`@langfuse/otel` 和 `@opentelemetry/sdk-node`。
- Langfuse request timeout 或 `fetch failed`：通常是 Langfuse 地址、网络或 Key 不可用。先完成语法检查，再阅读 `_shared/instrumentation.mjs`、`00-index.mjs` 和 `01-evaluate.mjs` 的调用链。

## 文章结论

LangSmith 接入 LangChain/LangGraph 简单，但 SaaS 生产成本和私有化门槛较高；Langfuse 基于 OpenTelemetry，框架绑定更弱，提供 Cloud 和开源自部署方案。两者都能覆盖 tracing、数据集和实验评测，生产环境可根据成本、数据控制和运维能力选择。

没有新增 fallback 示例：外部服务不可用时，最小复习路径是执行 `check`，然后按上述顺序阅读共享 Agent、instrumentation、tracing 入口和评测脚本。
