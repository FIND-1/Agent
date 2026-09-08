# PostgreSQL + pgvector 复习笔记

验证边界：数据库、Docker 和 embedding API 均为外部前置条件 / TODO；本次文件编号仅进行静态验证，未执行建表、CRUD 或服务启动。

## 1. 课程目标

本课围绕 AI Agent 的长期记忆场景，学习 PostgreSQL 如何同时承载：

- 传统关系数据：用户、会话、消息。
- 一对多关系：用户 -> 会话 -> 消息。
- 向量数据：消息 embedding。
- 语义检索：使用 pgvector 的余弦距离运算符 `<=>`。

核心取舍是：关系查询与向量检索放在同一个数据库中，避免 MySQL + Milvus 双写和结果拼接。

## 2. 目录与学习路线

```text
32_pgsql-test/
├─ 00-create_tables.sql     # 第 00 步：表结构、外键与 HNSW 索引
├─ docker-compose.yml      # 外部环境配置，不参与编号
├─ package.json
├─ README.md
├─ REVIEW_NOTES.md
├─ src/
│  ├─ 01-db.mjs            # 第 01 步：连接池和参数化查询
│  ├─ 02-users.mjs         # 第 02 步：用户 CRUD
│  ├─ 03-conversations.mjs # 第 03 步：会话 CRUD 与用户关联
│  ├─ 04-messages.mjs      # 第 04 步：消息 CRUD、embedding 与语义检索
│  └─ 05-index.mjs         # 第 05 步：串联完整演示
└─ typeorm-pg-crud/        # 最后阅读：独立 Nest + TypeORM 项目，不参与编号
```

建议按以下顺序复习：

1. 先读 `00-create_tables.sql`，理解表结构和外键关系。
2. 再读 `src/01-db.mjs`，掌握连接池和参数化查询。
3. 阅读 `02-users.mjs`、`03-conversations.mjs`、`04-messages.mjs`，对照 CRUD 和向量检索。
4. 阅读 `src/05-index.mjs`，理解用户、会话、消息和语义检索如何串联。
5. 最后阅读 `typeorm-pg-crud/src`，按 `main.ts → app.module.ts → conversations.module.ts → entities / dto → controller → service` 理解 ORM 查询和原生 SQL 的边界。

编号采用跨根目录 SQL 与 `src/` 脚本的统一学习序列 `00`–`05`，各目录按名称升序即可查看。`typeorm-pg-crud/` 是独立完整项目，保留框架文件名；配置和复习文档也不参与编号。

原生 pg 综合入口已改为 `src/05-index.mjs`。只有完成外部数据库、建表和根目录 `.env` 中的 `DATABASE_URL`、`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`EMBEDDINGS_MODEL_NAME` 配置后，才可在仓库根目录执行：

```bash
node lessons/32_pgsql-test/src/05-index.mjs
```

该命令会写入演示数据并调用 embedding API，本次未执行。

## 3. 数据模型

```text
users 1 ───── N conversations 1 ───── N messages
                                      └─ embedding vector(1024)
```

- `users.id`、`conversations.id`、`messages.id` 是自增主键。
- `conversations.user_id` 引用 `users.id`。
- `messages.conversation_id` 引用 `conversations.id`。
- 两个外键都配置了 `ON DELETE CASCADE`。
- `messages.embedding` 使用 pgvector 的 `vector(1024)` 类型。
- HNSW 索引使用 `vector_cosine_ops`，对应余弦距离检索。

## 4. 原生 pg 实现

### 连接与安全

`src/01-db.mjs` 创建 `Pool`，统一导出 `query`。业务 SQL 使用 `$1`、`$2` 参数绑定，避免直接拼接用户输入。

### CRUD

- `02-users.mjs`：用户增删改查。
- `03-conversations.mjs`：会话 CRUD，以及按用户查询会话列表。
- `04-messages.mjs`：消息 CRUD，以及按会话查询消息。

返回约定：查询不到单条数据返回 `null`，删除操作通过 `rowCount > 0` 转换为布尔值。

### embedding 与语义检索

1. `OpenAIEmbeddings.embedQuery(content)` 将文本转换为向量。
2. 写入消息时把向量序列化后传给 `$4::vector`。
3. 查询时使用 `$1::vector` 与 `embedding` 比较。
4. `embedding <=> queryVector` 越小表示距离越近。
5. `1 - distance` 转成更直观的 similarity，并按距离升序取前 `limit` 条。

关键 SQL 结构：

```sql
SELECT id, conversation_id, role, content,
       1 - (embedding <=> $1::vector) AS similarity
FROM messages
WHERE conversation_id = $2 AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT $3;
```

## 5. Nest + TypeORM 实现

入口是 `typeorm-pg-crud/src/app.module.ts`：

- `TypeOrmModule.forRoot()` 配置 PostgreSQL 连接。
- 注册 `User`、`Conversation`、`Message` 三个实体。
- `ConversationsModule` 提供业务接口。

### 实体关系

- `User.conversations` 使用 `@OneToMany`。
- `Conversation.user` 使用 `@ManyToOne`，并通过 `@JoinColumn({ name: 'user_id' })` 对应外键。
- `Conversation.messages` 使用 `@OneToMany`。
- `Message.conversation` 使用 `@ManyToOne`。
- `MessageRole` 限制消息角色为 `user`、`assistant`、`system`。

### ORM 与 SQL 的边界

`ConversationsService` 使用 TypeORM `EntityManager` 完成关系查询，并通过 `relations` 加载关联数据。

语义检索仍使用 `em.query()` 执行原生 SQL，因为 `<=>`、`::vector` 和 pgvector 索引属于 PostgreSQL 扩展能力，不能简单依赖普通 ORM 查询抽象。

## 6. 复习检查清单

- [ ] 能解释三张表的主键、外键和级联删除。
- [ ] 能说明为什么 embedding 维度必须与模型输出一致。
- [ ] 能解释 `<=>`、`ORDER BY` 和 `LIMIT` 的配合方式。
- [ ] 能区分原生 `pg` 查询与 TypeORM 实体查询。
- [ ] 能说明为什么语义检索仍保留原生 SQL。
- [ ] 能指出 `OPENAI_API_KEY`、embedding 模型和 PostgreSQL 连接分别在哪里配置。

## 7. 当前验证边界

本项目当前没有仓库内置的可运行 PostgreSQL 服务。`docker-compose.yml` 和 SQL 只是外部运行前置条件；完整 CRUD、TypeORM 连接、pgvector 建表和语义检索需要用户自行提供 Docker/PostgreSQL、pgvector 以及 embedding API 配置后验证。

在没有这些条件时，本课程只能进行源码静态检查、依赖检查和 TypeScript 类型检查，不能宣称数据库链路已运行通过。
