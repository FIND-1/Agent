# Lesson 28：Neo4j 知识图谱与 GraphRAG

> 验证边界：当前 `agent/` 项目没有可直接使用的 Docker、Neo4j 或其他数据库运行环境。本课程中的 `docker-compose.yml`、Cypher 文档和代码入口都作为教学结构 / TODO 保留；本轮只完成源码整理和静态检查，没有在本地启动容器、创建图谱或验证真实模型调用结果。

## 这节课要学会什么

这篇文章想解决的是传统 RAG 检索只能“找相似文本”或“找命中关键词”，但很难沿着实体关系继续推理的问题。课程把学习路径拆成四步：

1. 先理解为什么 Milvus 向量检索和 ES 关键词检索都不擅长“关系推理”。
2. 用 Neo4j 的节点、关系和 Cypher 语句把“奶茶 -> 配料 -> 工艺 -> 人群”串成知识图谱。
3. 用 `neo4j-driver` 在代码里执行最基础的增删改查，理解图数据库连接方式。
4. 用 LangGraph 串起 `问题解析 -> 生成 Cypher -> 执行图查询 -> 基于图结果回答`，形成最小 GraphRAG 流程。

一句话概括：这节课不是在替代向量检索，而是在补上传统 RAG 缺少的“关系链路检索”能力。

## 推荐复习顺序

| 阶段 | 文件 | 学习目的 | API Key | 外部服务 |
| --- | --- | --- | --- | --- |
| 00 图谱建模 | `queries/00-cypher.md` | 对照文章理解节点、关系与多跳查询长什么样 | 不需要 | Neo4j 图形界面或 Bolt 服务仅用于手动验证 |
| 01 图谱维护 | `queries/01-cypher2.md` | 复习属性更新、关系删除、节点删除的基础写法 | 不需要 | Neo4j 图形界面或 Bolt 服务仅用于手动验证 |
| 02 驱动连接 | `src/02-neo4j-test.mjs` | 理解 `neo4j-driver` 的连接、会话与最小 CRUD | 不需要 | Neo4j Bolt 服务 |
| 03 GraphRAG | `src/03-graphrag.mjs` | 理解 LangGraph 如何把图查询接进 RAG 工作流 | 需要 | Neo4j Bolt 服务 + 模型 API |

`queries/00-cypher.md`、`queries/01-cypher2.md` 以及 `src/02-neo4j-test.mjs`、`src/03-graphrag.mjs` 都是在保留原文文件名主体的前提下补了排序前缀，方便后续按文章主线连续复习。

## 文章主线和代码对应关系

| 原文知识点 | 当前文件 | 说明 |
| --- | --- | --- |
| `docker-compose.yml` 启动 Neo4j | `docker-compose.yml` | 保留原文容器配置，作为外部前置条件 / TODO |
| `cypher.md` 创建节点、关系、查询 | `queries/00-cypher.md` | 保留原始文件名主体，补 `00-` 排序前缀后移到子目录 |
| `cypher2.md` 更新与删除 | `queries/01-cypher2.md` | 保留原始文件名主体，补 `01-` 排序前缀后移到子目录 |
| `src/neo4j-test.mjs` | `src/02-neo4j-test.mjs` | 文章原文代码入口，补 `02-` 排序前缀并修复了富文本复制后的格式问题 |
| `src/graphrag.mjs` | `src/03-graphrag.mjs` | 文章最终 GraphRAG 示例，补 `03-` 排序前缀，并接入 `@lessons/shared/model` 与课程级 `ESAGENT_*` 配置 |

## 环境变量

`src/03-graphrag.mjs` 通过 `src/_shared/env.mjs` 读取**项目根目录**的 `.env`，并与 `lessons/27_es-agentic` 使用同一组课程变量。至少需要：

- `ESAGENT_API_KEY`
- `ESAGENT_BASE_URL`
- `ESAGENT_MODEL_NAME`
- `ESAGENT_RERANK_URL`
- `ESAGENT_RERANK_MODEL`

其中本课实际会用到 `ESAGENT_API_KEY`、`ESAGENT_BASE_URL`、`ESAGENT_MODEL_NAME`；其余两个变量与 Lesson 27 保持一致保留，方便后续统一复习和扩展。

课程目录不会额外新建 `.env`。如果当前根 `.env` 没有这组变量，GraphRAG 示例即使语法无误也无法真正请求模型。

## 运行方式

依赖统一复用项目根目录 `node_modules`。`lessons/28_neo4j-graphrag` 下不要单独执行安装命令，也不应生成独立 `node_modules`。

### 1. 语法检查

在课程目录运行：

```powershell
npm run check
```

### 2. 无需 API Key 可运行

当前没有“完全不依赖外部服务”的可执行脚本。最接近的无外部依赖复习材料是：

- `queries/00-cypher.md`
- `queries/01-cypher2.md`

它们适合直接阅读和手动抄到 Neo4j Browser 中理解语义，但不属于本地 Node 可执行脚本。

### 3. 需要模型 API

```powershell
npm run demo:graphrag
```

常见失败原因：

- 根 `.env` 缺少 `ESAGENT_API_KEY`、`ESAGENT_BASE_URL` 或 `ESAGENT_MODEL_NAME`
- 模型服务地址不可达
- `neo4j-driver` 没有在项目根安装为可直接解析的依赖

### 4. 需要外部服务

```powershell
npm run demo:neo4j
```

额外前置条件：

- Neo4j Bolt 服务：`bolt://localhost:7687`
- 默认账号密码：`neo4j / 12345678`
- 如果按原文准备环境，可参考课程根目录的 `docker-compose.yml`

注意：

- 本轮没有执行 `docker compose up -d`，也没有验证本地 `7474` / `7687` 端口是否空闲。
- `src/02-neo4j-test.mjs` 直接 `import 'neo4j-driver'`，但当前仓库根 `package.json` 里没有显式声明这个依赖，因此复习时若出现 `ERR_MODULE_NOT_FOUND`，需要先在项目根补齐依赖环境。

### 5. 外部服务不可用时的复习路径

如果你暂时没有 Neo4j 或模型 API，建议按下面顺序复习：

1. 先读 `queries/00-cypher.md`，理解图谱里有哪些节点和关系。
2. 再读 `queries/01-cypher2.md`，看图数据库最基础的更新和删除动作。
3. 然后读 `src/02-neo4j-test.mjs`，把它当成“Cypher 通过 driver 发送到数据库”的最小桥梁。
4. 最后读 `src/03-graphrag.mjs`，重点看四个节点函数和 LangGraph 的边连接，不必强求本地立刻跑通。

## 关键结论

- 向量检索擅长语义相似，ES 擅长关键词命中，Neo4j 擅长实体关系和多跳推理。
- GraphRAG 不是推翻传统 RAG，而是在检索阶段补上知识图谱这一层。
- Cypher 是图数据库里的核心查询语言，重点在“节点 + 关系方向 + 多跳路径”。
- LangGraph 版 GraphRAG 的关键不是 UI，而是把 `生成查询 -> 执行图查询 -> 基于结果回答` 变成稳定的工作流。
- 三类检索各有短板：语义检索不懂关系，关键词检索不懂语义，图检索不擅长海量全文模糊召回。

## 常见问题

- `ERR_MODULE_NOT_FOUND: Cannot find package 'neo4j-driver'`：当前根依赖未显式暴露该包，需先在仓库根补齐依赖环境。
- `根目录 .env 缺少配置：ESAGENT_*`：Lesson 28 已改为和 Lesson 27 共用课程级 `ESAGENT_*` 配置，不再读取通用 `OPENAI_*`。
- `Neo4j 示例执行失败： connect ECONNREFUSED`：本地没有启动 Neo4j，或端口不是 `7687`。
- `401` / `403` / `Invalid API key`：根 `.env` 的模型配置不完整或已失效。
- GraphRAG 返回 `未查询到相关知识`：常见原因是图里没有写入数据、Cypher 没生成对、或本地 Neo4j 根本没连上。

完整整理记录、原文差异和自检结果见 `REVIEW_NOTES.md`。
