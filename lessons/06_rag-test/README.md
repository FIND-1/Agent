# RAG：从内存检索到网页加载

本课通过故事文档理解索引、语义检索、上下文增强和生成，再用网页加载与切分扩展数据来源。RAG 可以减少缺少背景知识造成的回答问题，但检索错误、片段不足或模型生成错误仍可能造成幻觉。

## 学习顺序

| 顺序 | 示例 | 目标 | 依赖 |
| --- | --- | --- | --- |
| 00 | [00-hello-rag.mjs](src/00-hello-rag.mjs) | 原文故事：Document、向量化、检索、评分和生成 | 聊天与 embedding API；无需独立向量数据库 |
| 01 | [01-loader-and-spiltter.mjs](src/01-loader-and-spiltter.mjs) | 已有扩展：网页 Loader、文本切分与 RAG | 网页访问、聊天与 embedding API；无需独立向量数据库 |

原路径映射：`src/hello-rag.mjs` → `src/00-hello-rag.mjs`；`src/loader-and-spiltter.mjs` → `src/01-loader-and-spiltter.mjs`。后一文件名的拼写保留以便对照已有代码。课程配置、文档和 `src/` 目录不属于独立示例，不编号。

## 环境与运行

项目使用 Node.js 22+，依赖统一从仓库根目录安装；不要在本课程单独安装。根目录 `.env` 由共享环境加载器读取：聊天模型使用 `MODEL_NAME`、`OPENAI_API_KEY`、`OPENAI_BASE_URL`；embedding 使用 `EMBEDDINGS_MODEL_NAME`（或 `EMBEDDING_MODEL`）、`EMBEDDINGS_API_KEY`、`EMBEDDINGS_BASE_URL`，后两项缺省时分别回退到 `OPENAI_API_KEY`、`OPENAI_BASE_URL`。`EMBEDDINGS_DIMENSIONS` 可选，须与模型兼容。根据服务商填写实际可用的配置，不要提交密钥。

本课依赖 `@lessons/shared`、`@langchain/core`、`@langchain/classic`、`@langchain/community`、`@langchain/textsplitters`、`cheerio` 及共享模块所需 `@langchain/openai`、`dotenv`。当前根包未直接声明 `@langchain/classic`、`@langchain/textsplitters`、`cheerio`，且课程目录没有独立依赖链接；运行前需要在仓库根目录补齐并安装这些依赖，当前环境的离线安装未完成。

### 仅语法检查（无需 API Key）

在仓库根目录执行：

```sh
node --check lessons/06_rag-test/src/00-hello-rag.mjs
node --check lessons/06_rag-test/src/01-loader-and-spiltter.mjs
```

### 实际运行（需要模型 API）

```sh
node lessons/06_rag-test/src/00-hello-rag.mjs
node lessons/06_rag-test/src/01-loader-and-spiltter.mjs
```

两个脚本都需要网络访问模型服务；第二个还要请求代码中的掘金网页。没有 API Key 或服务不可用时没有可完整运行的示例，可先沿 `Document → fromDocuments → asRetriever → invoke → prompt → model.invoke` 阅读第一个文件，再查看第二个文件的 `load → splitDocuments`。本课没有 Docker、Milvus 或独立数据库要求，也没有新增 fallback 示例。

常见问题：模块找不到时先检查根目录依赖链接；401/403 检查密钥和服务商；模型不存在或维度不匹配时检查模型与 endpoint；网页不可访问、选择器失效或内容为空时检查目标页面和 `.main-area p`。内存向量库每次运行重建，退出即丢失。

## 关键结论

- 文档和查询需要兼容的 embedding 模型；向量相似度用于召回语义相近片段，关键词检索仍是有用的补充，RAG 不限于向量检索。
- `Document` 包含 `pageContent` 和 `metadata`；`fromDocuments` 建索引，`asRetriever({ k })` 设置召回数量，`invoke` 返回文档。
- 此版本 `MemoryVectorStore` 默认使用余弦相似度，`similaritySearchWithScore` 返回 `[Document, score]`，分数越大越相似；其他向量库可能返回距离，不能通用地套用相同公式。
- 多次检索会重复查询向量化和请求；输出相似度不等于回答正确或有充分证据。详情见 [REVIEW_NOTES.md](REVIEW_NOTES.md)。
