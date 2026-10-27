# 第 11 课：Memory 的存储、截断、总结与检索

目标：理解无状态模型如何通过传入历史继续对话，区分历史存储和上下文管理，并对照三种策略的取舍。

## 学习顺序

| 顺序 | 示例 | 目的 | 依赖 |
| --- | --- | --- | --- |
| 00 | [history-test](src/00-history-test.mjs) | 内存保存消息并在下一轮传给模型 | 聊天模型 API |
| 01 | [history-test2](src/01-history-test2.mjs) | 文件保存同一 session 的两轮对话 | 聊天模型 API、可写文件 |
| 02 | [history-test3](src/02-history-test3.mjs) | 从同一文件恢复历史并继续对话 | 聊天模型 API、上一步文件 |
| 03.00 | [truncation-memory](src/03_memory/00-truncation-memory.mjs) | 对比按条数和 token 截断 | 无 API；本地依赖 |
| 03.01 | [summarization-memory](src/03_memory/01-summarization-memory.mjs) | 按消息数触发摘要 | 聊天模型 API |
| 03.02 | [summarization-memory2](src/03_memory/02-summarization-memory2.mjs) | 按内容 token 数触发摘要 | 聊天模型 API |
| 03.03 | [insert-conversations](src/03_memory/03-insert-conversations.mjs) | 建立集合并写入对话向量 | Embedding API、外部 Milvus |
| 03.04 | [retrieval-memory](src/03_memory/04-retrieval-memory.mjs) | 检索历史、生成回复并写回 | 聊天及 Embedding API、外部 Milvus |

## 环境和运行

依赖统一从仓库根目录安装：Node.js 22+，在仓库根目录执行 `pnpm install`；不在课程目录安装依赖。模型配置来自仓库根目录 `.env`：聊天使用 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MODEL_NAME`；向量使用 `EMBEDDINGS_API_KEY`、`EMBEDDINGS_BASE_URL`、`EMBEDDINGS_MODEL_NAME`（或 `EMBEDDING_MODEL`），Key 和 URL 缺省时回退到对应 `OPENAI_*`。本例显式指定向量维度 1024，模型必须支持该维度。

以下命令均从仓库根目录运行。语法检查不调用 API：

```powershell
Get-ChildItem lessons/11_memory-test/src -Recurse -Filter *.mjs | ForEach-Object { node --check $_.FullName }
```

无需 API Key 的截断演示：

```powershell
node lessons/11_memory-test/src/03_memory/00-truncation-memory.mjs
```

需要聊天模型 API：

```powershell
node lessons/11_memory-test/src/00-history-test.mjs
node lessons/11_memory-test/src/01-history-test2.mjs
node lessons/11_memory-test/src/02-history-test3.mjs
node lessons/11_memory-test/src/03_memory/01-summarization-memory.mjs
node lessons/11_memory-test/src/03_memory/02-summarization-memory2.mjs
```

文件示例使用 `process.cwd()`：以上命令写入仓库根目录的 `chat_history.json`，并非课程目录中现有的同名数据文件。两次运行须保持相同工作目录和 session ID；运行会追加数据，注意保护已有文件。

需要外部 Milvus 和 API：先自行准备可访问的 `localhost:19530` Milvus，并确认 `conversations` 集合与 1024 维 embedding 匹配。以下操作会创建集合和写入数据，已有同名集合可能导致创建失败；先确认目标环境。

```powershell
node lessons/11_memory-test/src/03_memory/03-insert-conversations.mjs
node lessons/11_memory-test/src/03_memory/04-retrieval-memory.mjs
```

本仓库不提供 Milvus 服务；文章中启动 Milvus 的环境是外部前置条件。无服务时可阅读插入示例的 schema、索引和 embedding，再阅读检索示例的 search → prompt → invoke → insert；无法验证实际召回和写入。缺少模型 API 时可先运行截断示例并静态阅读其他示例。没有新增离线替代示例。

常见问题：`ERR_MODULE_NOT_FOUND` 先检查根目录依赖安装；认证或模型错误检查根 `.env` 与服务商兼容性；连接失败检查 Milvus 地址和集合；维度错误检查 embedding 输出与集合的 1024 维设置。文件恢复不到历史时检查工作目录、session ID 和文件是否已有数据。

## 关键结论

历史存储决定消息放在哪里；截断、总结和检索决定给模型哪些上下文。截断简单但会丢细节；总结节省上下文但可能失真；检索能按问题召回，却依赖索引质量、权限隔离和可用性。摘要与检索可组合，但本课未实现完整组合。更多细节和原文路径映射见 [REVIEW_NOTES](REVIEW_NOTES.md)。
