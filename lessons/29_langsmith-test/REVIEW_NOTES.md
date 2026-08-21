# LangSmith Test 复习整理记录

## 文章主线

这篇文章要解决的是 Agent 开发中的“盲盒感”：只看终端 token 流不能知道图节点、工具调用、耗时、token 消耗和错误位置。LangSmith 先提供 trace / monitor 让运行过程可观测，再通过 dataset / evaluator / experiment 把 RAG 回答效果量化。

学习递进关系：

1. 用一个会抛错的 LangGraph 验证失败 trace。
2. 准备 RAG 知识库：读取本地资料、切块、生成 embedding、写入 Milvus。
3. 构建 RAG Agent：先检索上下文，再基于上下文生成回答。
4. 创建 LangSmith Dataset：沉淀问题和标准答案。
5. 创建 evaluator：用 OpenEvals 从忠实度、有用性、检索相关性打分。
6. 运行 experiment：批量评测 RAG Agent。

## 本次整理内容

- 新增 `README.md`，作为后续复习入口。
- 新增 `REVIEW_NOTES.md`，记录文章主线、文件映射、依赖边界和自检结果。
- 补齐原文开头点名的 `trigger-error.mjs` 示例，并整理为 `src/00_trace/trigger-error.mjs`。
- 将 `src` 下示例按文章顺序拆成 `00_trace`、`01_ingest`、`02_rag`、`03_eval`。
- 保留原文文件 basename，通过阶段目录排序，避免编号示例文件之间互相 import。
- 新增 `src/_shared/rag-config.mjs`，集中 `MILVUS_COLLECTION`、`MILVUS_URI`、`DATASET_NAME` 等 lesson 专属配置。
- 29 课程已改为复用 `@lessons/shared/model` 中的 `createChatModel` / `createEmbeddings`。
- 更新 `package.json` 脚本，让命令指向编号后的文件路径。

## 原文路径调整说明

| 原文路径 | 当前路径 | 调整原因 |
| --- | --- | --- |
| `src/trigger-error.mjs` | `src/00_trace/trigger-error.mjs` | 原文点名但当前缺失，按 trace 阶段补齐 |
| `src/milvus_insert.mjs` | `src/01_ingest/milvus_insert.mjs` | 数据入库是 RAG 前置步骤 |
| `src/rag_agent.mjs` | `src/02_rag/rag_agent.mjs` | RAG 主逻辑放在第二阶段 |
| `src/cli.mjs` | `src/02_rag/cli.mjs` | CLI 是 RAG 人工验证入口 |
| `src/eval/build_dataset.mjs` | `src/03_eval/build_dataset.mjs` | Dataset 创建属于评估阶段 |
| `src/evals/evaluators.mjs` | `src/03_eval/evaluators.mjs` | 原文后半段写作 `evals`，当前统一到编号评估目录 |
| `src/evals/run_eval.mjs` | `src/03_eval/run_eval.mjs` | 评估运行入口排在 evaluator 之后 |

## 每个示例的学习目的

- `src/00_trace/trigger-error.mjs`：制造 LangGraph 节点异常，观察 LangSmith trace 如何记录失败 run。
- `src/01_ingest/milvus_insert.mjs`：把 `data/` 下 `.txt` / `.md` 文件切块、向量化并写入 Milvus collection。
- `src/02_rag/rag_agent.mjs`：用 LangGraph 表达 RAG 的两个核心节点：检索和生成。
- `src/02_rag/cli.mjs`：用默认问题运行 RAG Agent，观察回答和引用片段。
- `src/03_eval/build_dataset.mjs`：在 LangSmith 创建 `rag-eval-v1` 数据集。
- `src/03_eval/evaluators.mjs`：用 OpenEvals 内置 prompt 创建三个 RAG judge。
- `src/03_eval/run_eval.mjs`：运行 LangSmith experiment，得到 RAG 指标。

## 依赖边界

- 不需要模型 API、但需要 LangSmith 才能看到云端 trace：`src/00_trace/trigger-error.mjs`。
- 需要 LangSmith API：`src/03_eval/build_dataset.mjs`。
- 需要模型 API：`src/03_eval/evaluators.mjs` 中的 judge 模型。
- 需要模型 API + Milvus：`src/01_ingest/milvus_insert.mjs`、`src/02_rag/rag_agent.mjs`、`src/02_rag/cli.mjs`、`src/03_eval/run_eval.mjs`。
- 根目录 `.env` 是统一配置入口，本 lesson 不新增 `.env.example`。模型配置通过 `@lessons/shared/model` 读取：聊天模型使用 `MODEL_NAME`，embedding 优先使用 `EMBEDDINGS_MODEL_NAME`，并兼容文章里的 `EMBEDDING_MODEL`。
- 本次没有启动 Docker / Milvus，也没有验证数据写入、RAG 回答或 LangSmith 云端实验结果。

## 外部服务不可用时怎么复习

如果没有 Milvus 或模型 API，不要卡在运行结果上。最小复习路径是：

1. 阅读 `data/`，知道知识库样本覆盖售后、物流、支付、会员、保修。
2. 阅读 `src/01_ingest/milvus_insert.mjs`，画出“文件 -> chunk -> embedding -> Milvus row”的数据流。
3. 阅读 `src/02_rag/rag_agent.mjs`，画出 `START -> retrieve -> generate -> END`。
4. 阅读 `src/03_eval/build_dataset.mjs`，理解标准答案如何进入 Dataset。
5. 阅读 `src/03_eval/evaluators.mjs` 和 `run_eval.mjs`，理解指标如何绑定到 experiment。

没有新增 fallback 示例文件，因为原文没有提供 fallback，且本次需求重点是排序整理和后续复习。

## 公共代码抽离检查

- 单 lesson 内重复项：`OpenAIEmbeddings` 初始化在入库和 RAG 中重复；`ChatOpenAI` 初始化在 RAG 和 evaluator 中重复；`DATASET_NAME`、`MILVUS_COLLECTION` 等配置散落。
- 处理结果：lesson 专属常量放入 `src/_shared/rag-config.mjs`；模型初始化统一复用 `@lessons/shared/model`。
- 跨 lesson 检查：仓库已有 `lessons/_shared/model.mjs`，模型初始化已形成跨 lesson 共享能力。本轮确认 `prompt.pipe(createChatModel()).pipe(parser)` 可组合，因此 29 课程改为复用共享模型工厂。
- `src/_shared/` 非空，当前只保留 lesson 专属 RAG / LangSmith 配置。

## 注意点

- `docker-compose.yml` 只是 Milvus 外部服务模板；没有用户明确要求时，不启动、不验证端口。
- `src/03_eval/build_dataset.mjs` 多次运行可能重复创建 examples，复习时要注意 LangSmith 数据集里已有样例。
- `src/03_eval/run_eval.mjs` 依赖 `ask()`，因此评估前必须先完成 Milvus 数据入库。
- 原文中 `src/eval` 和 `src/evals` 写法不完全一致，本次统一放入 `src/03_eval` 并在 README 建立映射。
- `SUMMARY_RULES.txt` 本次被当作文章原文素材处理，真正的整理规则来自项目根目录 `SUMMARY_RULES.md`。
