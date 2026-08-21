# Lesson 27 整理与复习记录

> 外部依赖边界：当前 `agent/` 项目没有可直接使用的 Docker、数据库、Elasticsearch 或 Milvus 运行环境。本轮没有启动 Docker、Elasticsearch、Kibana、Milvus、etcd、MinIO，也没有执行索引 CRUD、向量写入或远程模型请求。已完成源码静态整理和逐文件语法检查；真实混合检索效果仍需用户提供外部环境后验证。

## 文章真正想教会什么

文章从纯语义检索对精确实体不稳定的问题出发，引入 ES 关键词检索形成混合召回。多路召回虽然找得更多，也会制造重复和噪声，因此需要按业务 ID 合并去重，再使用 Rerank 对原始问题和候选文档直接打分，最后只把少量高相关片段交给 LLM。

完整递进关系是：

1. 用官方 ES 客户端创建索引、设置 IK analyzer、批量写入文档。
2. 完成 ES 文档 CRUD 和关键词搜索。
3. 独立理解 Rerank 模型的输入、输出和 LangChain compressor 接口。
4. 将同一份带稳定 ID 的数据分别写入 ES 与 Milvus。
5. 用 LLM 将原始问题扩展成 3 条不同角度的检索问题。
6. 用 LangGraph 让 ES 与 Milvus 并行召回。
7. 合并去重、Rerank 取 Top N，再让 LLM 基于片段回答。

## 文章与代码对应关系

| 原文知识点               | 整理后的代码                                                            | 说明                                 |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------ |
| 原文创建索引入口         | `src/00_create.mjs`                                                     | 对应原文 `src/create.mjs`，补编号并修复富文本粘连后的语法 |
| 原文 CRUD 入口           | `src/01_operate.mjs`                                                    | 对应原文 `src/operate.mjs`，补编号方便逐段对照原文       |
| 创建 ES 索引与 Bulk 写入 | `src/00_elasticsearch/00-create-index-and-seed.mjs`                     | 保留 `travel_journal` 基础示例       |
| ES 文档 CRUD             | `src/00_elasticsearch/01-document-crud.mjs`                             | 恢复完整安全链路，只删除本次新建文档 |
| 自定义 DashScope Rerank  | `src/_shared/dashscope-rerank.mjs`                                      | 修复错误构造器拼写并增加配置校验     |
| 独立 Rerank 测试         | `src/01_rerank/00-test.mjs`                                      | 统一读取根 `.env` 的课程专用变量     |
| ES 与 Milvus 同源写入    | `src/02_rag/00-seed-data.mjs`                                           | 保留用户替换后的全部 `ROWS` 数据     |
| Query 改写               | `src/_shared/query-augment.mjs`、`src/02_rag/01-query-augment.mjs` | 公共实现与可执行观察入口分离         |
| LangGraph 混合检索       | `src/02_rag/02-hybrid-retrieval.mjs`                                    | 补回原课程缺失的完整最终示例         |
## 本次整理内容

### 本轮复核修正

- 修复 `src/02_rag/00-seed-data.mjs` 中 Milvus 创建索引字段误用未定义变量的问题，统一使用 `_shared/constants.mjs` 中的 `MILVUS_VECTOR_FIELD`。
- 将 `src/02_rag/01-query-augment.mjs` 调整为可直接执行的 Query Augmentation 观察入口，公共 schema、prompt 和工具函数继续保留在 `_shared/query-augment.mjs`。
- 修复 `src/02_rag/02-hybrid-retrieval.mjs` 的富文本粘连、错误 import 路径和环境变量读取方式，改为统一复用 `_shared/env.mjs`、`_shared/constants.mjs`、`_shared/dashscope-rerank.mjs` 与 `_shared/query-augment.mjs`。
- 删除 `src/03_fallback/00-offline-hybrid-fallback.mjs` 及其 README / package 引用，因为原文没有提及这条 fallback 示例，按当前规则不再作为课程正式内容保留。
- 保留 `src/04_infrastructure/elasticsearch/Dockerfile` 文件本身，但移出课程主学习路径引用；原文虽未直接点名该路径，`docker-compose.yml` 的 `build` 配置已对本地 Dockerfile 形成隐含依赖。

### 命名与顺序

- ES 阶段：`src/00_elasticsearch/00-create-index-and-seed.mjs` → `01-document-crud.mjs`。
- Rerank 阶段：`src/01_rerank/00-test.mjs`。
- RAG 阶段：`src/02_rag/00-seed-data.mjs` → `01-query-augment.mjs` → `02-hybrid-retrieval.mjs`。
`src/00_create.mjs`、`src/01_operate.mjs` 保留为文章原文对照入口的排序版；其余可执行 `.mjs` 按阶段目录从 `00` 连续编号，方便系统复习。`dashscope-rerank.mjs` 和 `query-augment.mjs` 是被多个入口复用的无顶层副作用模块，因此统一移入 `_shared` 且不编号，避免编号示例之间相互 import。

### 结构调整

- 抽出 `_shared/env.mjs`：统一从项目根 `.env` 读取 `ESAGENT_*` 变量，避免不同工作目录造成配置丢失。
- 抽出 `_shared/constants.mjs`：统一 `life_notes`、ES/Milvus 地址和向量字段名，保证 seed 与 retrieval 一致。
- RAG 阶段的 Chat / Embeddings 初始化已接入仓库级 `@lessons/shared/model`，并通过 options 保留本课程的 `ESAGENT_API_KEY`、`ESAGENT_BASE_URL`、`ESAGENT_MODEL_NAME` 配置。
- 补齐文章后半段缺失的 Query 改写独立入口与 LangGraph 混合检索代码。
- 补齐 `docker-compose.yml` 中的 Milvus、etcd、MinIO，并补上其 `build` 配置所需的 ES + IK Dockerfile；它是原文 compose 编排的配套文件，不作为单独复习入口。
- 更新最小 `package.json`，提供静态检查、Rerank、seed 和完整混合检索脚本。
- 将文章原文点名的 `src/create.mjs`、`src/operate.mjs` 整理为 `src/00_create.mjs`、`src/01_operate.mjs`，并修复富文本复制带来的 `newDate()`、格式粘连和缩进问题；编号版 ES 示例继续作为结构化复习入口。
- 将原文 `src/rag/query-augment.mjs` 对齐为 `src/02_rag/01-query-augment.mjs`，只增加排序前缀，不再改成 `query-augment-demo.mjs` 这类非原文文件名。

### 可读性与安全性

- 每个核心示例加入复习型注释，标明新增知识、适用场景和依赖边界。
- 原文代码注释视为学习材料保留；后续只允许补充复习说明或更正说明，不应为了整理而静默删除。
- 修复 `from"..."`、混乱缩进、缺失分号和 `thrownewError` 等格式/运行错误。
- 移除 CRUD 示例中硬编码删除已有文档 ID 的行为，改为删除本轮创建的临时文档。
- Rerank 封装对 API Key、URL 和响应索引做最小校验。
- `02_rag/00-seed-data.mjs` 的重建行为在文档中明确标为破坏性课程操作。

## `_shared/` 抽离结果

重复检查覆盖环境变量读取、ES/Milvus 常量、模型初始化、schema、examples、prompt block 和工具函数：

- 环境变量读取在 Rerank、seed、hybrid 三处重复，已抽到 `_shared/env.mjs`。
- `life_notes`、服务地址和 Milvus 字段在 seed、hybrid 两处重复，已抽到 `_shared/constants.mjs`。
- `src/00_create.mjs`、`src/01_operate.mjs` 保留 ES Client 与 `travel_journal` 常量的局部初始化，这是为了优先对齐原文点名入口；编号版和后续 RAG 链路不再继续扩大这类重复。
- Chat/Embeddings 初始化已改为复用仓库级 `@lessons/shared/model`；独立 Rerank 示例刻意保留最小初始化以展示 Rerank API，因此未继续封装。
- Query schema 与 Prompt 只服务 Query Augmentation 模块，没有重复，不额外拆散。
- `_shared/` 当前包含四个实际使用的文件，没有空目录或无意义封装。

## 依赖分类

- 无 API Key、需要 ES：`src/00_create.mjs`、`src/01_operate.mjs`、`00_elasticsearch/00-create-index-and-seed.mjs`、`01-document-crud.mjs`。
- 需要远程模型：`01_rerank/00-test.mjs`、`02_rag/01-query-augment.mjs`。
- 需要 API + ES + Milvus：`02_rag/00-seed-data.mjs`、`02-hybrid-retrieval.mjs`。
- `_shared/*.mjs` 均为无顶层调用的公共模块。

## 原文与现有项目的差异

1. 原文使用 `OPENAI_*`、`RERANK_*` 等通用变量；项目根 `.env` 使用 `ESAGENT_*` 课程专用变量。本轮以当前项目配置为准，README 只记录变量名，不记录值。
2. 原文代码从富文本复制后出现 `asyncfunction`、`thrownewError`、`awaitPromise.all` 等粘连错误；整理后的源码已恢复为有效 JavaScript。
3. 原文给出的最终 `query-augment.mjs` 和 `hybrid-retrieval.mjs` 在课程目录中缺失，本轮已补齐，并为 Query 改写增加独立编号入口。
4. 原文注释声称 Milvus 版本“必须与 ES 完全一致”，这一判断不成立；两者是独立产品，只需各自组件版本兼容。
5. 原文把架构称为可直接生产使用。更准确的结论是：这是常见生产架构骨架，仍需离线评测、超时重试、监控、鉴权、数据同步和容量规划。
6. 用户已替换 `02_rag/00-seed-data.mjs` 的 `ROWS`；这些内容已原样保留，不影响课程知识主线。

## 后续复习坑点

- 先召回、后 Rerank：Rerank 只对候选集排序，召回阶段漏掉的文档无法被恢复。
- Query 改写必须保留订单号、型号等精确实体，否则反而会伤害关键词召回。
- seed 与 retrieval 的嵌入模型、向量维度、collection 名、text/vector field 必须完全一致。
- ES 与 Milvus 两份文档需要稳定且一致的业务 ID；不要用两边各自生成的内部 ID 去重。
- `02_rag/00-seed-data.mjs` 会删除重建 `life_notes`，只应对课程环境运行。
- `00` 在索引存在时仍会继续 Bulk 写入，因此重复执行会产生额外文档。

## 自检记录

- `_shared/`：4 个文件，均被实际使用，没有空目录。
- Markdown：课程根目录仅有 `README.md` 与 `REVIEW_NOTES.md`。
- 依赖：`@elastic/elasticsearch` 8.17.0 与其他依赖均位于项目根，根锁文件已更新；lesson 内没有 `node_modules`。
- import：未发现编号示例 import 其他编号示例。
- 格式：未发现 `from"..."`、`thrownewError`、`awaitPromise.all` 等粘连问题。
- 原文注释：已补充规则要求；后续复查需确认原文代码注释未被静默删除，错误注释应以更正说明处理。
- 语法：13 个 `.mjs` 全部通过 `node --check`。
- 外部链路：未运行，仍需用户提供 ES + IK、Milvus 和远程模型环境。
- 本次复查额外确认：当前项目未配置可用 Docker / 数据库 / ES 服务，所有 ES、Milvus、docker-compose 相关内容只作为外部前置条件和教学 TODO，不作为本地已验证运行路径。
