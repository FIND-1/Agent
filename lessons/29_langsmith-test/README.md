# LangSmith 全链路观测与 RAG 评估

本 lesson 对应文章《LangSmith 全链路观测：从 Agent 调试到 RAG 量化评估》。学习目标是把 LangSmith 的 trace、monitor、dataset、evaluator、experiment 串起来，理解如何从“看见 Agent 执行过程”推进到“量化评估 RAG 效果”。

## 外部前置条件

当前项目不默认提供 Docker、Milvus 或远程模型服务，本次只完成源码整理和静态检查。要实际运行 RAG 链路，需要先由你确认并准备这些外部条件：

- 根目录 `.env` 中配置 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MODEL_NAME`。
- Embedding 配置优先读取 `EMBEDDINGS_API_KEY`、`EMBEDDINGS_BASE_URL`、`EMBEDDINGS_MODEL_NAME`；未配置时会回退到 `OPENAI_API_KEY`、`OPENAI_BASE_URL`，模型名也兼容文章里的 `EMBEDDING_MODEL`。
- 根目录 `.env` 中配置 `LANGCHAIN_API_KEY`、`LANGCHAIN_PROJECT`、`LANGCHAIN_TRACING_V2=true`。
- Milvus 服务可访问，默认 `MILVUS_URI=http://localhost:19530`、`MILVUS_COLLECTION=rag_docs`。
- 如使用本目录 `docker-compose.yml` 启动 Milvus，它属于外部运行前置条件，不是本次静态验证结果。

## 文件顺序

```txt
lessons/29_langsmith-test/
  README.md
  REVIEW_NOTES.md
  docker-compose.yml
  package.json
  data/
    membership.md
    payment.md
    product_warranty.md
    sample.txt
    shipping.md
  src/
    _shared/
      rag-config.mjs
    00_trace/
      trigger-error.mjs
    01_ingest/
      milvus_insert.mjs
    02_rag/
      rag_agent.mjs
      cli.mjs
    03_eval/
      build_dataset.mjs
      evaluators.mjs
      run_eval.mjs
```

## 原文到代码的对应关系

| 复习顺序 | 当前路径 | 原文路径 | 知识点 |
| --- | --- | --- | --- |
| 00 | `src/00_trace/trigger-error.mjs` | `src/trigger-error.mjs` | 用失败节点观察 LangSmith trace |
| 01 | `src/01_ingest/milvus_insert.mjs` | `src/milvus_insert.mjs` | 切分文档、生成 embedding、写入 Milvus |
| 02 | `src/02_rag/rag_agent.mjs` | `src/rag_agent.mjs` | LangGraph RAG：retrieve + generate |
| 03 | `src/02_rag/cli.mjs` | `src/cli.mjs` | 用默认问题人工观察 RAG 回答和引用片段 |
| 04 | `src/03_eval/build_dataset.mjs` | `src/eval/build_dataset.mjs` | 创建 LangSmith Dataset |
| 05 | `src/03_eval/evaluators.mjs` | `src/evals/evaluators.mjs` | 使用 OpenEvals 内置 RAG 评估器 |
| 06 | `src/03_eval/run_eval.mjs` | `src/evals/run_eval.mjs` | 批量运行 experiment 并查看指标 |

## 运行说明

### 1. 语法检查

```bash
pnpm --filter langsmith-test run check
```

也可以在本目录逐个执行 `node --check src/.../*.mjs`。这个检查不需要 API Key，也不会连接 Milvus。

### 2. 无需 API Key 可运行

没有完整业务示例属于“无需 API Key 可运行”。`trigger-error.mjs` 不调用模型，但如果希望在 LangSmith 看到 trace，仍需要 `LANGCHAIN_API_KEY` 和 `LANGCHAIN_TRACING_V2=true`。

### 3. 需要 LangSmith API

```bash
pnpm --filter langsmith-test run trace:error
pnpm --filter langsmith-test run eval:dataset
```

常见失败原因：`LANGCHAIN_API_KEY` 未配置、`LANGCHAIN_TRACING_V2` 未开启、网络无法访问 LangSmith。

### 4. 需要模型 API + Milvus

```bash
pnpm --filter langsmith-test run insert
pnpm --filter langsmith-test run ask
pnpm --filter langsmith-test run eval:run
```

常见失败原因：Milvus 没有启动、`MILVUS_URI` 不可访问、根目录 `.env` 中模型或 embedding 配置缺失、LangSmith Dataset 尚未创建。

### 5. 外部服务不可用时的复习路径

不新增原文没有的 fallback 文件。Milvus 或模型服务不可用时，按下面顺序静态复习：

1. 先看 `src/00_trace/trigger-error.mjs`，理解 trace 能记录失败节点。
2. 再看 `src/01_ingest/milvus_insert.mjs`，只关注“读取 data -> splitDocuments -> embedDocuments -> createCollection -> insert”的数据流。
3. 接着看 `src/02_rag/rag_agent.mjs`，理解 `retrieve` 和 `generate` 两个节点如何组成 RAG 图。
4. 最后看 `src/03_eval/*`，理解 Dataset、Evaluator、Experiment 的关系。

## 关键结论

- LangSmith trace 用来记录 Agent / Chain / Graph 的节点输入输出、耗时、token 消耗和报错。
- 只要配置 `LANGCHAIN_API_KEY`、`LANGCHAIN_PROJECT`、`LANGCHAIN_TRACING_V2=true`，LangChain / LangGraph 运行过程就可以自动上报。
- Dataset 是问题和标准答案的集合，适合做回归评估。
- Evaluation 把回答效果拆成指标，文章中使用 OpenEvals 的忠实度、有用性、检索相关性三个 RAG 指标。
- Experiment 是一次批量评估运行，用来对比不同 Agent、提示词、模型或检索策略的效果。
