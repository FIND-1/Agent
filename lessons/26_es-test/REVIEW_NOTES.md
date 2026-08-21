# Lesson 26 整理与复习记录

> 外部依赖边界：文章中的 Docker Compose、Elasticsearch、Kibana、IK 插件安装和 HTTP CRUD 都需要用户自行提供外部环境。本轮没有启动服务、占用端口、构建镜像或执行 ES 请求；相关内容均是待环境可用后验证的教学路径。

## 文章到底想教会什么

文章从纯向量检索的边界切入：语义相似不等于专业术语或精确实体匹配准确。因此 RAG 往往还需要一条关键词检索路径，而 Elasticsearch 正是为大规模全文检索设计的中间件。

核心链路不是记住 CRUD 命令，而是理解三个部件的分工：

1. **倒排索引负责召回**：把 `文档 -> 关键词` 翻转为 `关键词 -> 文档`。
2. **IK 负责中文切词**：索引阶段产生可被查到的词条，查询阶段产生用于匹配的查询词。
3. **BM25 负责排序**：候选文档都包含查询词时，综合词频、长度和词的稀有程度给出相关性顺序。

文章最后把关键词检索放回 RAG：ES 与 Milvus 不是二选一，前者擅长关键词和实体，后者擅长语义近似，模型或排序层可以融合两路结果。

## 文章与文件对应关系

| 文章知识点                  | 整理后的文件                                          | 对应说明                                                   |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Elasticsearch / Kibana 安装 | `docker-compose.yml`                                  | 保留 ES 8.17.0、Kibana 8.17.0 和端口映射，标为外部前置条件 |
| IK 插件安装                 | `src/03_infrastructure/elasticsearch/Dockerfile`      | 基于 ES 8.17.0 下载严格同版本插件                          |
| 索引与文档 CRUD             | `src/01_elasticsearch/00-basic-crud.http`             | 按创建索引、写入、查询、更新、删除排列                     |
| `text` 与 `keyword`         | `src/01_elasticsearch/00-basic-crud.http`             | 分别用 `match` 和 `term` 展示适用边界                      |
| 倒排索引                    | `src/00_inverted-index/00-inverted-index-demo.mjs`    | 无服务 fallback，输出词条与文档 ID 的映射                  |
| standard 与 IK 对比         | `src/01_elasticsearch/01-ik-analysis-and-search.http` | 依次观察三种 analyzer 的输出                               |
| `ik_max_word` / `ik_smart`  | `src/01_elasticsearch/01-ik-analysis-and-search.http` | 在 `life_note` mapping 中区分索引与查询 analyzer           |
| BM25                        | `src/02_bm25/00-bm25-ranking-demo.mjs`                | 无服务 fallback，以教学公式输出得分排序                    |

## 本次整理内容

### 结构调整

- `src/` 下按阶段整理为 `00_inverted-index → 01_elasticsearch → 02_bm25 → 03_infrastructure`。
- `01_elasticsearch/` 集中可逐段执行的 `.http` 请求，避免命令散落在文档中。
- `src/_shared/search-utils.mjs` 集中两个离线示例都会使用的分词与词频统计逻辑。
- 新增 `README.md` 作为快速入口，新增本文件记录完整知识主线和整理依据。

### 配置修正

- 删除 Compose 顶层已过时且非必要的 `version` 字段。
- 修复端口和 environment 列表项中注释前缺少空格的问题；原写法可能让 `#` 后文字成为值的一部分。
- 把 ES 数据卷统一为 `volumes/es/data`，与文章安装 IK 后的最终结构一致。
- 在 Compose 与 Dockerfile 开头标出 Docker、网络和插件下载依赖。
- 把课程 `package.json` 改成私有 ESM 学习包，增加静态检查和两个离线 demo 脚本。

### 降低复习成本

- 将“原理”与“真实中间件操作”分开：没有 Docker 时仍可复习倒排索引和 BM25。
- 为每个核心代码示例加入复习型注释，说明解决的问题、相对上一步新增内容和局限。
- 在请求文件中显式区分 `match` 与 `term`，并提醒删除请求的破坏性。
- README 将命令按语法检查、无需 API、模型 API、外部服务和 fallback 分类。

## `_shared/` 抽离说明

检查了模型初始化、环境变量、schema、examples、prompt block 和工具函数：

- 本课程没有模型初始化、环境变量、schema、few-shot examples 或 prompt block。
- `tokenize` 同时用于倒排索引与 BM25，`countTerms` 是搜索算法辅助逻辑，因此放入 `src/_shared/search-utils.mjs`。
- 核心倒排索引构建与 BM25 公式没有抽离，避免示例文件只剩调用语句而失去教学价值。
- `_shared/` 非空，编号示例之间互不 import，只依赖共享工具。

## 依赖与可运行性分类

### 无需 API Key、无需外部服务

- `src/00_inverted-index/00-inverted-index-demo.mjs`
- `src/02_bm25/00-bm25-ranking-demo.mjs`

### 需要模型 API

- 无。

### 需要外部服务

- `src/01_elasticsearch/00-basic-crud.http`：需要 Elasticsearch 8.17.0。
- `src/01_elasticsearch/01-ik-analysis-and-search.http`：需要 Elasticsearch 8.17.0 和同版本 IK 插件。
- `docker-compose.yml`、`src/03_infrastructure/elasticsearch/Dockerfile`：需要 Docker；构建 IK 镜像时还需要网络。

课程代码不读取环境变量，不需要修改项目根目录 `.env`。课程没有第三方 Node 依赖，直接复用根目录 Node.js / pnpm 环境，因此没有向根 `package.json` 或锁文件新增依赖。

## fallback 路径

外部服务不可用时：

1. `00_inverted-index/00-inverted-index-demo.mjs` 保留“切词 -> 构建词条映射 -> 多词求交集”的召回链路。
2. 阅读 `01_elasticsearch/01-ik-analysis-and-search.http` 的 analyzer 配置，理解 IK 的职责；本地 fallback 不冒充 IK。
3. `02_bm25/00-bm25-ranking-demo.mjs` 保留“查询词 -> 文档频率 -> 长度归一化 -> 累加得分 -> 排序”的链路。

这个 fallback 不模拟 ES HTTP API、分片、持久化、IK 词典或生产级搜索，只用于在外部服务缺失时不断开知识主线。

## 文章与代码的不一致或需注意之处

- 附件名为 `SUMMARY_RULES.txt`，但正文实际是 Elasticsearch 课程文章，不是项目整理规则。本次整理规则来自项目根目录 `SUMMARY_RULES.md`，附件只作为课程原文。
- 文章把 MySQL 的存储结构概括为“表和行”、ES 概括为“索引和文档”，适合入门类比，但两者的数据模型、事务与搜索能力并非简单一一等价。
- “毫秒级”是典型目标而非无条件保证，实际延迟受数据量、mapping、查询、分片、硬件与缓存影响。
- `ik_max_word` 入库、`ik_smart` 查询是常见教学配置，不是所有中文业务的唯一最佳方案，应以真实语料评估。
- 原文结尾把 `ik_smart` 拼成了 `ik_samrt`，整理后的文件已使用正确名称。
- Compose 关闭了安全认证与 TLS，只适合本机学习环境，不能直接用于生产或不可信网络。
- 文章提到 MySQL -> ES 数据同步和 ES + Milvus 混合检索，但当前 lesson 没有实现同步、融合、去重或重排，这些保留为后续学习范围。

## 后续复习坑点

- 修改 analyzer 通常需要新建索引并重建数据，不能把分词策略当成无成本的运行时开关。
- `term` 不会分析查询文本，不要把它当成 `text` 字段的普通全文搜索。
- 全量 `PUT /index/_doc/id` 与 `_update` 局部更新语义不同，练习时避免误覆盖字段。
- `_delete_by_query`、删除索引和整文件批量执行请求都可能破坏数据。
- ES 与 IK 的版本应严格匹配；插件下载地址或版本失效时，需要重新确认官方/供应方发布信息。
- 真实混合检索还需解决两路分数不可直接比较、结果去重、融合策略与重排等问题。

## 自检记录

- 课程根目录 Markdown：只保留 `README.md` 和 `REVIEW_NOTES.md`。
- `_shared/`：非空，仅包含跨示例复用的 `search-utils.mjs`。
- 编号示例 import：不存在编号示例互相 import。
- 子课程 `node_modules`：不应生成；本轮不在 lesson 内安装依赖。
- Node 依赖：没有新增第三方依赖，根 `package.json` 与锁文件无需修改。
- 环境变量：代码不读取环境变量，README 已明确无需 `.env`。
- 外部服务：README 已分类，且已提供两个无需服务的 fallback 示例。
- `node --check`：三个 `.mjs` 文件均通过语法检查。
- 离线运行：倒排索引与 BM25 两个 demo 均执行成功；BM25 示例排序为 `B > C > A`。
- Compose：本机没有 `docker` 命令，因此 `docker compose config` 与实际容器链路未验证；保留为外部环境 TODO。
- `pnpm --filter`：当前根依赖状态会触发 pnpm 尝试重建 `node_modules`，非交互环境主动中止；为保护用户现有依赖，改用零安装的 `node` / `npm --prefix` 完成检查。
