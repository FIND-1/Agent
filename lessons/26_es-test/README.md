# Lesson 26：Elasticsearch 全文检索

> 验证边界：本课程的 Docker、Elasticsearch、Kibana 和 IK 插件均属于外部前置条件。当前仓库没有由本任务可直接使用的 Docker / Elasticsearch 环境，因此本次只完成代码整理、离线示例运行和配置静态检查，不把容器启动、索引 CRUD 或 IK 请求写成已验证结果。

## 学习目标

这节课要串起一条完整主线：

```text
精确实体不适合只靠向量检索
  -> Elasticsearch 用倒排索引定位候选文档
  -> IK 改善中文分词
  -> BM25 为候选文档计算相关性并排序
  -> 与向量检索组合成混合检索
```

完成复习后，应能解释：

- 为什么关键词检索适合专业术语和精确实体。
- `text` 与 `keyword` 字段的检索方式为什么不同。
- 倒排索引为什么是“词语 -> 文档”，而不是“文档 -> 词语”。
- 为什么索引阶段常用 `ik_max_word`，查询阶段常用 `ik_smart`。
- BM25 如何利用词频饱和、文档长度归一化和稀有词权重排序。

## 推荐复习顺序

| 顺序 | 文件 | 学习目的 | API Key | 外部服务 |
| --- | --- | --- | --- | --- |
| 1 | `src/00-inverted-index-demo.mjs` | 从正向存储推导“词语 -> 文档 ID”的倒排索引 | 不需要 | 不需要 |
| 2 | `requests/00-basic-crud.http` | 对齐索引、mapping、文档 CRUD、`match` 与 `term` | 不需要 | Elasticsearch |
| 3 | `requests/01-ik-analysis-and-search.http` | 对比 standard、`ik_max_word` 与 `ik_smart` | 不需要 | Elasticsearch + IK |
| 4 | `src/01-bm25-ranking-demo.mjs` | 用教学版 BM25 观察相关性排序策略 | 不需要 | 不需要 |
| 5 | `docker-compose.yml`、`elasticsearch/Dockerfile` | 理解 ES、Kibana 与 IK 镜像的外部部署结构 | 不需要 | Docker + 网络 |

## 运行与验证

请在仓库根目录 `D:\1project\agent` 执行。课程不需要模型 API，也不读取根目录 `.env`。这里使用 `npm --prefix` 只调用课程脚本，不会在子课程安装依赖或生成 `node_modules`。

### 1. 语法检查

```powershell
npm --prefix lessons\26_es-test run check
```

### 2. 无需 API Key、无需外部服务

```powershell
npm --prefix lessons\26_es-test run demo:inverted-index
npm --prefix lessons\26_es-test run demo:bm25
```

这两个 fallback 示例可直接复习核心原理，但它们不是 Elasticsearch 的替代实现：分词函数不具备 IK 词典能力，BM25 也只保留教学所需的核心公式。

### 3. 需要模型 API

本课程没有需要模型 API 的文件，也没有环境变量要求。

### 4. 需要 Docker / Elasticsearch 的外部路径

以下命令仅作为外部前置条件满足后的手动操作说明，本次没有执行：

```powershell
cd lessons\26_es-test
docker compose up -d --build
```

服务预期地址：

- Elasticsearch：`http://localhost:9200`
- Kibana：`http://localhost:5601`

容器可用后，再使用支持 `.http` 文件的客户端按顺序手动执行：

1. `requests/00-basic-crud.http`
2. `requests/01-ik-analysis-and-search.http`

请求文件最后包含删除操作，应只逐段执行，不要在有需保留数据的环境中整文件批量运行。

### 5. fallback 复习路径

如果 Docker 未安装、镜像下载失败、端口被占用或 IK 插件地址不可达：

1. 运行 `demo:inverted-index`，观察词语如何关联文档 ID。
2. 阅读两个 `.http` 文件，区分 `match`、`term`、`analyzer` 和 `search_analyzer`。
3. 运行 `demo:bm25`，对比包含稀有查询词的文档为何排名更高。
4. 把 ES/IK 请求保留为 TODO，待外部环境可用后再验证，不能把离线输出当作 ES 实测结果。

## 关键结论

- MySQL 是业务原始数据的常见主存储；Elasticsearch 通常承载需要搜索的字段副本。数据同步属于后续工程问题，本课程未实现。
- `text` 字段会经过 analyzer 并进入倒排索引，适合全文检索；`keyword` 保留整体值，适合精确匹配、聚合和排序。
- 倒排索引把词条映射到文档集合，使检索不必逐行扫描全部文本。
- 索引分词决定倒排索引里有哪些词条；查询分词决定用哪些词条查索引，两者必须合理配合。
- 中文场景下，standard analyzer 的切词结果通常不符合词语语义；IK 提供更适合中文的切词方式。
- `ik_max_word` 倾向产生更丰富的索引词条，`ik_smart` 倾向用较粗粒度的查询词，二者是课程中的常见组合，不代表所有业务的唯一配置。
- Elasticsearch 默认使用 BM25 相关性算法。重复堆砌词语不会让得分无限线性增长，过长文档会被归一化，稀有词通常更有区分度。
- 关键词检索擅长精确实体，向量检索擅长语义相似；实际 RAG 可融合两路结果，但融合逻辑不在本 lesson 范围内。

## 常见报错

- `docker: command not found`：本机未安装或未启动 Docker；直接走 fallback 路径。
- `port is already allocated`：`9200` 或 `5601` 已由用户环境占用；不要擅自停止现有进程，应调整映射端口或由用户处理。
- `unknown analyzer [ik_max_word]`：IK 插件未安装、安装失败，或插件版本与 ES 不一致。
- `failed to obtain node locks`：数据卷可能被另一个 ES 实例占用，或目录权限不正确。
- 请求返回 `index_not_found_exception`：尚未执行对应的创建索引请求，或索引已被删除。
- `term` 查询 text 字段结果不符合预期：`term` 不分析查询文本，精确值应优先使用 `keyword` 字段。
- Node 提示不支持 `Set.prototype.intersection`：请使用项目要求的 Node.js 22 或更新版本。

## 一周后快速复习

先用一句话复述“倒排索引 + IK + BM25”各自解决的问题，再运行两个离线 demo；最后只读两个请求文件，能说清每个请求为何使用 `match`、`term` 或指定 analyzer 即可。需要继续学习时，再进入“关键词召回 + 向量召回 + 重排/融合”的混合检索链路。
