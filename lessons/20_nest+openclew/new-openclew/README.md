# new-openclew

一个用于复习 Nest + LangChain tool + TypeORM + 定时任务的示例项目。

重要前置：当前 `agent/` 项目没有提供 Docker、MySQL 或可直接使用的 SQL 数据库环境。因此本课中 TypeORM、MySQL、用户 CRUD、Job 持久化等数据库相关链路只能作为教学结构和 TODO，当前不能做完整端到端运行验证。

本课对应上下两部分博文的主线：先把用户表 CRUD 接入数据库，再把 CRUD、发邮件、网络搜索、当前时间、定时任务都封装成 tool；随后抽出 `ToolModule`，让模型可以创建定时任务，并让定时任务到点后进入新的后台 agent loop。

完整讲义、源码导读和复习自检见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。

## 学习路径

建议按下面顺序复习：

1. `src/app.module.ts`：理解根模块如何组装配置、邮件、TypeORM、Schedule、业务模块。
2. `src/users/*`：理解 `User` entity、DTO、Controller、Service 如何完成数据库 CRUD。
3. `src/tool/*`：理解每个 LangChain tool 如何独立封装，并由 `ToolModule` 统一导出。
4. `src/ai/ai.module.ts`：理解普通业务 tool、`ToolModule` 和 `JobAgentService` 如何接入 AI 模块。
5. `src/ai/ai.service.ts`：理解 `ChatOpenAI.bindTools()`、tool call loop 和流式接口里的工具调用处理。
6. `src/job/*`：理解 `Job` entity、`SchedulerRegistry`、`cron/every/at` 三类运行时任务。
7. `src/ai/job-agent.service.ts`：理解到点执行任务时，为什么要启动一个不包含 `cron_job` 的后台 agent loop。

## 核心能力

| 能力 | 入口 | 复习重点 |
| --- | --- | --- |
| 用户 CRUD | `src/users/users.service.ts` | `EntityManager.save/find/findOne/update/delete` |
| 数据库 CRUD tool | `src/tool/db-users-crud-tool.service.ts` | 用 `action` 区分 `create/list/get/update/delete` |
| 当前时间 tool | `src/tool/time-now-tool.service.ts` | 让模型能计算“几分钟后”的真实触发时间 |
| 定时任务 tool | `src/tool/cron-job-tool.service.ts` | 用 `list/add/toggle` 管理持久化任务 |
| 任务运行时 | `src/job/job.service.ts` | `CronJob`、`setInterval`、`setTimeout` 与 `SchedulerRegistry` |
| 后台执行 agent | `src/ai/job-agent.service.ts` | 到点后根据 `instruction` 再决定调用邮件、搜索或数据库 tool |

## 环境配置

项目从工作区根目录读取环境变量：

```text
D:\1project\agent\.env
```

常用变量：

```env
OPENAI_API_KEY=你的模型密钥
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus

BOCHA_API_KEY=博查搜索密钥

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-account
MAIL_PASS=your-password
MAIL_FROM=no-reply@example.com
```

数据库连接目前写在 `src/app.module.ts`：

```text
host=localhost
port=3306
username=root
password=
database=openclew
```

`synchronize: true` 会在服务启动时按 `User` 和 `Job` entity 自动同步表结构，适合课程示例，不适合直接照搬到生产环境。

## 运行方式

当前仓库不提供数据库运行环境，所以不要把数据库相关接口作为默认验证路径。只有在你额外提供 MySQL 或 Docker 环境，并创建 `openclew` database 后，才可以尝试运行完整服务。

```powershell
pnpm install
pnpm start:dev
```

默认监听：

```text
http://localhost:3000
```

如果在全新环境里出现 `Cannot find module`，优先核对 `package.json` 是否已经包含源码使用到的依赖，例如：

- `@langchain/core`
- `@langchain/openai`
- `@nestjs/typeorm`
- `typeorm`
- `mysql2`
- `zod`
- `class-validator`

当前整理只改文档，不修改依赖声明。

## 接口

| 地址 | 说明 |
| --- | --- |
| `GET /` | Nest 默认示例接口 |
| `POST /users` | 创建用户 |
| `GET /users` | 查询用户列表 |
| `GET /users/:id` | 查询单个用户 |
| `PATCH /users/:id` | 更新用户 |
| `DELETE /users/:id` | 删除用户 |
| `GET /ai/chat?query=...` | 让模型通过 tool call 完成任务并返回完整结果 |
| `GET /ai/chat/stream?query=...` | 通过 SSE 流式返回模型内容 |

## 快速复习样例

可以用这些自然语言请求观察 tool 选择：

- `创建一个用户，名字 Alice，邮箱 alice@example.com`
- `列出当前所有用户`
- `1 分钟后提醒我喝水`
- `每 5 分钟提醒我检查一次用户列表`
- `列出当前所有定时任务`

定时任务的关键拆分规则：

- “1 分钟后”“明天 9 点”这类一次性任务使用 `type=at`。
- “每 5 分钟”“每天”这类重复任务使用 `type=every`。
- 用户明确给出 Cron 表达式时使用 `type=cron`。
- `instruction` 只保存“要做什么”，不要保存“什么时候做”。

## 当前实现边界

下半部分博文的最终形态是：定时任务触发后调用后台 `JobAgentService.runJob(instruction)`，由新的 agent loop 执行邮件、搜索或数据库 tool。

当前源码已经具备：

- `ToolModule`：统一导出模型和各类 tool。
- `time_now`：让模型能计算未来触发时间。
- `JobAgentService`：不包含 `cron_job` 的后台 agent loop。
- `JobService`：持久化任务并注册 `cron/every/at` 运行时任务。

但当前 `JobService.recordJobRun()` 仍然只记录日志和更新 `lastRun`，还没有把 `JobAgentService.runJob(job.instruction)` 接到触发回调里。复习时要把这点当作本项目和博文最终链路之间的明确差距。

## 检查命令

```powershell
pnpm build
pnpm test
pnpm lint
```

本课依赖模型、MySQL、搜索和邮件配置。当前项目没有 Docker/MySQL/SQL 环境，所以课 20 只能做静态整理、源码导读和 TypeScript 解析检查；不要把数据库链路写成已验证。
