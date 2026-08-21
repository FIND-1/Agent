# Lesson 27：混合检索 RAG 与 Rerank

> 验证边界：当前 `agent/` 项目没有可直接使用的 Docker、数据库、Elasticsearch 或 Milvus 运行环境。Elasticsearch、IK、Kibana、Milvus、etcd、MinIO 与远程模型 API 都是外部前置条件；本课程只把相关配置和脚本作为教学结构 / TODO 保留。本地默认只做源码整理和静态检查，不把容器启动、索引创建、向量集合写入或远程模型请求写成已验证结果。

## 这节课要学会什么

纯语义检索对专业术语、型号、订单号等精确实体可能不够稳定；纯关键词检索又难以理解换一种说法后的语义。课程把两者组合起来：

```text
原始问题
  → LLM 改写出 3 个检索问题
  → 每个问题并行执行 ES 关键词召回 + Milvus 语义召回
  → 按业务 ID 合并去重
  → Rerank 对“原始问题—候选文档”重新评分
  → 只把 Top N 文档交给 LLM 生成答案
```

核心目标是同时改善召回覆盖率与上下文精度。Rerank 负责候选集的精排，不负责找回召回阶段已经漏掉的文档。

## 推荐复习顺序

| 阶段        | 文件                                                | 学习目的                                | API Key | 外部服务                                    |
| ----------- | --------------------------------------------------- | --------------------------------------- | ------- | ------------------------------------------- |
| 原文 ES     | `src/00_create.mjs`                                 | 对应原文 `create.mjs`，创建索引并写入种子数据 | 不需要  | ES + IK                                     |
| 原文 ES     | `src/01_operate.mjs`                                | 对应原文 `operate.mjs`，串联 ES 文档 CRUD | 不需要  | ES + IK                                     |
| 00 ES       | `src/00_elasticsearch/00-create-index-and-seed.mjs` | 创建 ES 索引、理解 mapping 与 Bulk 写入 | 不需要  | ES + IK                                     |
| 00 ES       | `src/00_elasticsearch/01-document-crud.mjs`         | 串联文档新增、查询、更新、搜索和删除    | 不需要  | ES + IK                                     |
| 01 Rerank   | `src/01_rerank/00-test.mjs`                  | 独立观察候选文档重新排序                | 需要    | Rerank API                                  |
| 02 RAG      | `src/02_rag/00-seed-data.mjs`                       | 将同一业务文档写入 ES 与 Milvus         | 需要    | ES + IK、Milvus、Embeddings API             |
| 02 RAG      | `src/02_rag/01-query-augment.mjs`              | 独立观察 LLM 生成 3 条多角度检索问句    | 需要    | Chat API                                    |
| 02 RAG      | `src/02_rag/02-hybrid-retrieval.mjs`                | 用 LangGraph 串起完整混合检索链路       | 需要    | ES + IK、Milvus、Chat/Embeddings/Rerank API |

`src/00_create.mjs`、`src/01_operate.mjs` 是文章原文 `src/create.mjs`、`src/operate.mjs` 的排序版，方便对照原文阅读，也避免根目录里出现未编号入口。`src/00_elasticsearch/` 下是同一知识点的阶段化复习入口，用来和后续 Rerank、RAG 阶段保持统一学习顺序。

`src/_shared/` 放跨阶段复用的根 `.env` 读取、索引常量、Rerank 封装和 Query Augmentation 实现。Chat / Embeddings 模型初始化复用仓库级 `@lessons/shared/model`，通过 options 继续传入本课程的 `ESAGENT_*` 配置。它们是公共模块，不参与示例编号。

`docker-compose.yml` 中的 `build` 配置隐含依赖一个本地 ES + IK 构建目录，因此课程里保留了 `src/04_infrastructure/elasticsearch/Dockerfile` 作为配套文件；它不是原文点名的主学习入口，不单独列入复习顺序。

## 环境变量

所有模型相关脚本统一读取**项目根目录**的 `.env`，使用 `# ----- 27_es-agentic 特有 -----` 下的变量：

- `ESAGENT_API_KEY`
- `ESAGENT_BASE_URL`
- `ESAGENT_RERANK_URL`
- `ESAGENT_MODEL_NAME`
- `ESAGENT_RERANK_MODEL`

课程不会在 lesson 内新建 `.env`。`text-embedding-v3` 作为本课程固定的嵌入模型名写在种子与混合检索示例中。

## 运行方式

依赖统一从项目根目录安装，`lessons/27_es-agentic` 下不要单独执行安装命令，也不应生成独立 `node_modules`。

### 1. 语法检查

在课程目录运行：

```powershell
npm run check
```

### 2. 需要模型 API

只测试 Rerank：

```powershell
npm run demo:rerank
npm run demo:query-augment
```

常见失败原因：根 `.env` 缺少课程变量、URL 无效、API Key 失效、模型名或接口地域不匹配、网络不可达。

### 3. 需要外部服务

`docker-compose.yml` 仅保留文章中的 ES/Kibana/Milvus 教学编排，不能代表当前项目已经配置或验证了 Docker 环境。Docker、端口和外部服务由用户自行管理，本课程不会自动启动、停止或接管任何本地服务。外部环境需自行提供：

- Elasticsearch 8.17.0：`http://localhost:9200`
- 同版本 IK 插件
- Kibana 8.17.0：`http://localhost:5601`
- Milvus 2.5.25：`localhost:19530`
- 可用的 Chat、Embeddings、Rerank API

环境就绪后，ES 基础阶段有两套入口，复习时二选一即可：

原文对照入口：

```powershell
node .\src\00_create.mjs
node .\src\01_operate.mjs
```

编号复习入口：

```powershell
node .\src\00_elasticsearch\00-create-index-and-seed.mjs
node .\src\00_elasticsearch\01-document-crud.mjs
```

进入混合检索阶段：

```powershell
npm run seed:hybrid
npm run demo:hybrid
```

注意：`src/00_create.mjs` / `src/01_operate.mjs` 与 `src/00_elasticsearch/*` 都使用 `travel_journal` 教学索引，属于同一组 ES 基础练习。`02_rag/00-seed-data.mjs` 会先删除再重建 `life_notes` 的 ES 索引和 Milvus 集合，只适合课程数据；不要对真实业务环境运行。

如果当前机器没有 ES / IK / Milvus，请不要直接运行本组命令；这类脚本会在 `http://localhost:9200` 或 `localhost:19530` 连接阶段失败。当前课程按原文对齐，不额外保留本地 fallback 示例；外部环境不可用时，建议直接阅读 `02_rag/00-seed-data.mjs`、`01-query-augment.mjs`、`02-hybrid-retrieval.mjs` 的阶段注释与 LangGraph 节点关系。

## 关键结论

- ES 关键词检索适合精确实体与字面匹配，Milvus 语义检索适合不同表达之间的语义相似。
- Query 改写提高召回覆盖率，但会放大检索次数、延迟与成本。
- 两个存储必须携带一致的业务 ID，才能在合并时稳定去重。
- Rerank 比嵌入召回更关注问题与单篇候选文档的直接相关性，适合做小候选集精排。
- 只把 Top N 片段交给生成模型，可以减少无关上下文，但不能单独消除幻觉。
- 这是常见的生产级 RAG 架构骨架，不等于已经具备生产要求；监控、评测、权限、超时、重试与数据同步仍需补充。

## 常见问题

- `Failed to parse URL from undefined`：检查是否使用 `ESAGENT_RERANK_URL`，以及脚本是否通过 `_shared/env.mjs` 加载根 `.env`。
- `index_not_found_exception`：先运行 `02_rag/00-seed-data.mjs`，或确认 `life_notes` 已创建。
- `unknown analyzer [ik_*]`：ES 镜像没有安装与 ES 同版本的 IK 插件。
- Milvus 连接失败：确认 `19530` 可用，且 standalone、etcd、MinIO 均健康。
- Embeddings 维度不一致：种子数据所用嵌入模型与查询阶段必须一致，需要重建集合后再写入。
- 结果合并后异常变少：检查 ES 与 Milvus 文档的 `metadata.id` 是否一致且非空。

完整整理记录和文章—代码差异见 `REVIEW_NOTES.md`。
