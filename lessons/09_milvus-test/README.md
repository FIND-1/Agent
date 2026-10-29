# Milvus：日记检索与电子书 RAG

> 外部前置条件 / TODO：本仓库未提供可直接使用的 Milvus、MySQL 或 Docker 编排。文章的 Docker Compose、服务启动、集合创建和 CRUD 均需自行准备外部环境；本次只做静态检查，未验证数据库运行结果。不要对有价值的数据执行示例写入和删除操作。

本课先将日记嵌入并存入 Milvus，再完成语义查询、RAG、更新和删除；最后阅读已有电子书扩展。与 [第 6 课的内存向量库](../06_rag-test/README.md) 对照，关注外部向量库的 schema、索引、持久化与数据生命周期。

## 学习顺序与依赖

| 顺序 | 示例 | 知识点 | 运行依赖与数据影响 |
| --- | --- | --- | --- |
| 00 | [00-insert.mjs](src/00-insert.mjs) | 建立 `ai_diary` 的 schema、索引并写入五条日记 | Milvus、embedding API；创建集合和写入 |
| 01 | [01-query.mjs](src/01-query.mjs) | 查询向量、COSINE 和 top 2 | 已有日记集合、Milvus、embedding API |
| 02 | [02-rag.mjs](src/02-rag.mjs) | 检索日记、组装上下文并调用聊天模型 | 日记集合、Milvus、embedding 和聊天 API |
| 03 | [03-update.mjs](src/03-update.mjs) | 更新内容时重新生成向量，再 upsert | 日记集合、Milvus、embedding API；修改 `diary_001` |
| 04 | [04-delete.mjs](src/04-delete.mjs) | 按 ID、ID 列表和条件删除 | 日记集合、Milvus；删除多条数据，不需模型 API |
| 05 | [05-ebook-writer.mjs](src/05-ebook-writer.mjs) | EPUB 加载、切分、向量化与写入 | EPUB、Milvus、embedding API；**删除并重建整个 `ebook_collection`** |
| 06 | [06-ebook-query.mjs](src/06-ebook-query.mjs) | 按 `book_id` 过滤并查询片段 | 已有电子书集合、Milvus、embedding API |
| 07 | [07-ebook-reader-rag.mjs](src/07-ebook-reader-rag.mjs) | 检索电子书片段并生成回答 | 电子书集合、Milvus、embedding 和聊天 API |

00～04 对应文章的 insert → query → rag → update → delete；05～07 是仓库已有的电子书扩展。需要按示例顺序理解依赖，但运行 04 或 05 会改变或清除已有数据。执行前请使用独立测试环境并确认集合内容；00 已存在同名集合时不保证可重复执行。

## 环境与运行

项目使用 Node.js 22+，根目录 `.env` 由 `@lessons/shared/env-loader` 加载。聊天配置为 `MODEL_NAME`、`OPENAI_API_KEY`、`OPENAI_BASE_URL`；embedding 配置为 `EMBEDDINGS_MODEL_NAME`（或 `EMBEDDING_MODEL`）、`EMBEDDINGS_API_KEY`、`EMBEDDINGS_BASE_URL`，后两项缺省时回退到对应 `OPENAI_*`。这些示例显式请求 1024 维，embedding 服务、已存向量和集合 schema 必须兼容；不要提交真实密钥。

脚本目前将 Milvus 地址固定为 `localhost:19530`；Docker、Milvus 和可用模型 API 均由外部提供。原文提到的 [Milvus releases](https://github.com/milvus-io/milvus/releases) Compose 配置和 Attu 是外部准备项；其 `docker compose -f ./milvus-standalone-docker-compose.yml up -d` 与 `http://localhost:9091/healthz` 仅作为原文参考，仓库没有提供该配置，也未验证。Attu 可用于观察集合，并非脚本依赖。MySQL 双写在文章中是架构设想，本课没有实现或验证。

依赖统一由仓库根目录管理，不在子课程安装。根包包含 Milvus SDK、LangChain、文本切分器和电子书解析依赖；SDK 统一使用 3.x。Milvus、电子书写入和模型接口需要外部环境，本次未做联调。

### 语法检查：不需要 API Key 或服务

在仓库根目录 PowerShell 执行：

```powershell
Get-ChildItem lessons/09_milvus-test/src/*.mjs | ForEach-Object { node --check $_.FullName }
```

### 完整示例：需要外部服务

在单独的测试环境准备好服务、模型配置与数据后，从课程目录执行：

```powershell
cd lessons/09_milvus-test
node src/00-insert.mjs
node src/01-query.mjs
node src/02-rag.mjs
node src/03-update.mjs
node src/04-delete.mjs
node src/05-ebook-writer.mjs
node src/06-ebook-query.mjs
node src/07-ebook-reader-rag.mjs
```

`05` 以当前工作目录读取 `./哈利波特与魔法石.epub`，因此以上命令先进入课程目录；写入前会先删除旧集合，即使后续 EPUB 加载失败也可能已丢失旧数据。电子书文件在当前课程目录；对外分享时自行确认文件授权。

没有 API Key 也没有可完整运行的无服务示例：04 不需要 API Key，但仍需 Milvus 且会删除数据。服务不可用时，先读 00 的 schema、索引和向量化，再读 01 的 search、02 的上下文注入，最后对照 03/04 的数据变化及 05～07 的书籍过滤；可用 `node --check` 检查语法。本课没有新增 fallback。

常见问题：连接失败先确认外部服务地址和端口；集合不存在或未加载先确认初始化与服务状态；向量维度不一致要核对 schema 和 embedding 模型；API 401/模型不存在要检查密钥、模型和 endpoint；EPUB 找不到要核对工作目录；模块找不到先检查根目录依赖。部分示例捕获异常后只输出日志，进程退出码不一定反映失败。
