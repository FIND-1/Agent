# 课程整理说明

验证边界：Docker、PostgreSQL/pgvector 和 embedding API 为外部前置条件 / TODO，本次仅调整路径并进行静态检查。

## 文件编号与旧路径映射

按现有课程学习路线编号，保留原文件名主体和业务实现：

| 原路径 | 当前路径 | 学习内容 |
| --- | --- | --- |
| `create_tables.sql` | `00-create_tables.sql` | 表结构、外键与向量索引 |
| `src/db.mjs` | `src/01-db.mjs` | 连接池与参数化查询 |
| `src/users.mjs` | `src/02-users.mjs` | 用户 CRUD |
| `src/conversations.mjs` | `src/03-conversations.mjs` | 会话 CRUD 与用户关联 |
| `src/messages.mjs` | `src/04-messages.mjs` | 消息 CRUD 与语义检索 |
| `src/index.mjs` | `src/05-index.mjs` | 综合演示入口 |

这些旧路径只用于对照，实际导入和执行使用当前路径。SQL 是单独的建表教学步骤，因此参与编号；`docker-compose.yml` 未引用旧 SQL 文件名，无需因本次重命名调整。

编号 import 的例外：`01-db.mjs` 是连接池模块，`02`–`04` 是原有业务模块，编号表达阅读顺序；它们不会在导入时执行 CRUD 或 embedding 请求。连接池对象仍在模块顶层创建，embedding 客户端仍按需初始化。保留综合入口对这些模块的导入，不复制实现或抽空教学文件。`05-index.mjs` 会执行演示，不作为其他模块的复用入口。

不参与编号的项目和文件：

- `typeorm-pg-crud/` 是独立完整 Nest 应用，目录与内部文件名保持不变；在原生 pg 示例之后，按 `main.ts → app.module.ts → conversations.module.ts → entities / dto → controller → service` 复习。
- `docker-compose.yml`、`package.json` 和复习文档属于配置或入口文档，保留原名。

## 文章与源码对齐

- 文章中的原生 `pg` 示例对应 `src/01-db.mjs`、`src/02-users.mjs`、`src/03-conversations.mjs`、`src/04-messages.mjs` 和 `src/05-index.mjs`。
- 文章中的 Nest + TypeORM 示例对应 `typeorm-pg-crud/src`。
- `typeorm-pg-crud` 已声明 `@nestjs/typeorm`、`typeorm` 和 `pg`，并由根目录 pnpm workspace 纳入管理。

## 注意事项

- `typeorm-pg-crud/src/app.module.ts` 当前直接写入数据库连接配置，复习时应理解为教学示例；后续接入真实环境应迁移到环境变量，并避免提交密码。
- `synchronize: true` 适合学习阶段，不应直接用于生产数据库迁移。
- `embedding vector(1024)` 必须与实际 embedding 模型输出维度一致。
- 语义检索依赖 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 和可用 embedding 模型。
- 当前仓库没有可直接使用的 SQL 数据库环境，因此未执行 Docker 启动、建表、CRUD 或语义检索运行验证。
