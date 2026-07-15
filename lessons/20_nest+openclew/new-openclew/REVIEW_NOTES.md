# REVIEW_NOTES

## 重要前置说明

当前 `agent/` 项目没有提供 Docker、MySQL 或可直接使用的 SQL 数据库环境。课 20 的 TypeORM、MySQL、用户 CRUD、Job 持久化和数据库驱动定时任务链路只能作为教学结构与 TODO 记录，不能在当前项目里宣称已经完成端到端运行验证。

本课当前可验证范围：源码静态阅读、文档整理、复习注释、TypeScript 解析检查。不可验证范围：MySQL 建库建表、TypeORM 真实连接、数据库 CRUD、服务重启后的任务恢复、依赖数据库的定时任务持久化。

## 本次整理范围

本文件把 `SUMMARY_RULES.txt` 和 `SUMMARY_RULES1.txt` 中的上下两部分博文主线整理成 `new-openclew` 的长期复习笔记，并结合当前源码核对实际实现。

本轮整理文档和源码复习注释：

```text
README.md
REVIEW_NOTES.md
src/**/*.ts 中的复习注释块
```

不修改 Nest 运行逻辑、不修改接口行为、不处理 `dist/` 或 `node_modules/`。

## 讲义摘要

本节要解决的问题是：一个 Agent 产品如何支持“以后再做某件事”或“周期性做某件事”。

完整链路可以拆成两层：

```text
用户自然语言
  -> AiController
  -> AiService
  -> ChatOpenAI.bindTools()
  -> cron_job tool
  -> JobService 持久化 Job
  -> SchedulerRegistry 注册运行时任务
  -> 到点后执行 instruction
  -> JobAgentService 再次进入 tool call loop
```

这节的重点不是 Cron 表达式本身，而是三件事：

- 把数据库、邮件、搜索、时间、定时任务都抽象成模型可调用的 tool。
- 把定时任务拆成“什么时候执行”和“执行什么内容”。
- 到点后启动新的后台 agent loop，让它根据保存的 `instruction` 再决定调用哪些 tool。

`SUMMARY_RULES1.txt` 下半部分进一步强调：创建定时任务只是第一步，真正的产品级能力还需要在触发时重新进入 agent loop。否则系统只能“记得任务并打印日志”，不能真正完成邮件、搜索、数据库更新这类动作。

## 一、TypeORM 用户 CRUD

博文先用 TypeORM 给 Agent 增加真实数据库能力。ORM 的作用是把对 TypeScript class 的操作映射成 SQL 表操作。

当前项目里的用户表模型是 `src/users/entities/user.entity.ts`：

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `id` | `@PrimaryGeneratedColumn()` | 自增主键 |
| `name` | `@Column({ length: 50 })` | 用户名 |
| `email` | `@Column({ length: 50 })` | 邮箱 |
| `createdAt` | `@CreateDateColumn()` | 创建时间 |
| `updatedAt` | `@UpdateDateColumn()` | 更新时间 |

`src/app.module.ts` 中的 `TypeOrmModule.forRoot()` 注册了 MySQL 连接，并把 `User` 和 `Job` 放进 `entities`。示例开启了 `synchronize: true`，服务启动时会按 entity 同步表结构。

`src/users/users.service.ts` 用 `EntityManager` 完成 CRUD：

| 方法 | TypeORM 调用 | 语义 |
| --- | --- | --- |
| `create()` | `save(User, dto)` | 新增用户 |
| `findAll()` | `find(User)` | 查询列表 |
| `findOne(id)` | `findOne(User, { where: { id } })` | 查询单个 |
| `update(id, dto)` | `update(User, id, dto)` | 更新 |
| `remove(id)` | `delete(User, id)` | 删除 |

`CreateUserDto` 已声明 `class-validator` 装饰器，但当前 `src/main.ts` 没有挂载全局 `ValidationPipe`。也就是说，这些校验规则在 HTTP 入参上不会自动生效；如果后续要把接口当作真实 API 使用，需要补上管道配置。

## 二、把 CRUD 封装成 tool

用户 CRUD 接口能让 HTTP 客户端操作数据库，但 Agent 需要的是模型可读的工具描述和结构化入参。

`src/tool/db-users-crud-tool.service.ts` 把用户表操作封成 `db_users_crud`：

```text
action=create/list/get/update/delete
id=查询、更新、删除时使用
name=create/update 时使用
email=create/update 时使用
```

这个 tool 的关键设计是：模型只需要选择 `action` 并补齐参数，真正的数据库操作仍然由 `UsersService` 执行。这样业务逻辑不会散落在 prompt 或模型回答里。

## 三、ToolModule 的边界

博文后半段把 tool 从 `AiModule` 里抽出来，当前项目已经有对应实现：`src/tool/tool.module.ts`。

`ToolModule` 统一提供并导出：

- `CHAT_MODEL`
- `SEND_MAIL_TOOL`
- `WEB_SEARCH_TOOL`
- `DB_USERS_CRUD_TOOL`
- `TIME_NOW_TOOL`
- `CRON_JOB_TOOL`

这个结构让两个 agent 共享同一批工具：

- `AiService` 面向用户请求，可以使用包括 `cron_job` 在内的全部工具。
- `JobAgentService` 面向后台任务执行，不注入 `cron_job`，避免定时任务执行时继续创建定时任务导致递归。

`src/tool/tool.types.ts` 里的 `invokeAppTool()` 和 `toToolMessageContent()` 是小型适配层，负责把 LangChain tool 的返回值统一成 `ToolMessage` 可接收的字符串。

## 四、AiService 的 tool call loop

`src/ai/ai.service.ts` 的核心是：

```text
model.bindTools([...tools])
messages = [SystemMessage, HumanMessage]
while true:
  aiMessage = modelWithTools.invoke(messages)
  if 没有 tool_calls:
    返回最终内容
  逐个执行 tool_call
  把结果包装成 ToolMessage 追加回 messages
```

这就是最小 agent loop。模型不是直接“拥有能力”，而是在每一轮中提出工具调用；服务端执行工具，再把执行结果放回上下文，模型继续推理或给出最终答复。

`runChainStream()` 多了一个边界处理：一旦流式 chunk 中出现 tool call 片段，就不继续把这些中间内容直接推给客户端，而是先执行工具，进入下一轮。否则浏览器会看到不完整的工具调用过程。

## 五、定时任务的三种类型

博文用 OpenClaw 的源码结论抽象出三类任务，当前项目也沿用了这个模型：

| 类型 | 运行时实现 | 适合的自然语言 |
| --- | --- | --- |
| `cron` | `CronJob` | 用户明确给 Cron 表达式，或需要复杂日历规则 |
| `every` | `setInterval` | 每 X 分钟、每小时、每天这类固定间隔重复任务 |
| `at` | `setTimeout` | X 分钟后、明天 9 点、某个时间点执行一次 |

`src/job/entities/job.entity.ts` 把任务持久化为数据库记录：

| 字段 | 说明 |
| --- | --- |
| `id` | UUID，作为数据库主键和 SchedulerRegistry 任务名 |
| `instruction` | 到点后真正要执行的自然语言任务 |
| `type` | `cron`、`every`、`at` |
| `cron` | `cron` 类型的表达式 |
| `everyMs` | `every` 类型的间隔毫秒数 |
| `at` | `at` 类型的触发时间点 |
| `isEnabled` | 是否启用 |
| `lastRun` | 最近一次触发时间 |

## 六、JobService 的运行时管理

`src/job/job.service.ts` 同时管理数据库记录和内存中的运行时任务。

核心职责：

- `onApplicationBootstrap()`：服务启动后读取所有启用中的任务，并重新注册到 `SchedulerRegistry`。
- `listJobs()`：返回数据库任务，并补充当前进程中是否正在运行的 `running` 状态。
- `addJob()`：创建 `Job` 记录；如果启用，立即注册运行时任务。
- `toggleJob()`：启用或停用任务，并同步启动或停止运行时任务。
- `startRuntime()`：按 `cron/every/at` 分别创建 `CronJob`、interval、timeout。
- `stopRuntime()`：按类型删除或停止运行时任务。

`at` 类型执行后会把 `isEnabled` 更新为 `false`，因为它是一次性任务。

## 七、cron_job tool 的建模规则

`src/tool/cron-job-tool.service.ts` 把 `JobService` 封装成模型可调用的 `cron_job`。

入参结构：

```text
action=list/add/toggle
id=toggle 时需要
enabled=toggle 时可选，不传则取反
type=add 时需要，cron/every/at
instruction=add 时需要，只写任务内容
cron=type=cron 时需要
everyMs=type=every 时需要
at=type=at 时需要，ISO 时间字符串
```

最重要的是 `instruction` 的拆分：

- “1 分钟后提醒我喝水”里，“1 分钟后”用于计算 `at`。
- `instruction` 只保存“提醒我喝水”。
- 当前轮只创建任务，不要立刻执行提醒、发邮件或搜索。

这条规则决定了定时任务是否可靠。否则模型可能在创建任务时就把未来动作提前执行了。

## 八、为什么需要 time_now tool

模型本身不知道服务端当前时间。用户说“10 分钟后执行”时，如果没有当前时间，模型无法算出 `at` 的 ISO 时间。

`src/tool/time-now-tool.service.ts` 提供：

```json
{
  "iso": "当前 ISO 时间",
  "timestamp": 1234567890
}
```

`AiService` 可以先调用 `time_now`，再用当前时间加偏移量生成 `cron_job.add` 所需的 `at`。

## 九、后台 JobAgentService

博文的最终目标是：定时任务到点后，不只是打印日志，而是启动新的 agent loop，按 `instruction` 执行真正的任务。

当前项目已经有 `src/ai/job-agent.service.ts`：

- 注入 `SEND_MAIL_TOOL`
- 注入 `WEB_SEARCH_TOOL`
- 注入 `DB_USERS_CRUD_TOOL`
- 注入 `TIME_NOW_TOOL`
- 不注入 `CRON_JOB_TOOL`

它的 `runJob(instruction)` 与 `AiService` 类似：模型根据任务文本决定是否调用工具，工具结果再回填为 `ToolMessage`，直到模型给出最终说明。

当前实现边界需要注意：`JobService.recordJobRun()` 目前只记录日志并更新 `lastRun`，还没有把 `JobAgentService.runJob(job.instruction)` 接进去。因此当前源码已经具备后台 agent 的类和工具集合，但定时触发点还没有真正调用后台 agent 执行任务。

如果后续要补全博文里的最终链路，重点改动会是：

- 让 `JobService` 注入 `JobAgentService`。
- 处理 `JobModule`、`AiModule`、`ToolModule` 之间的循环依赖，必要时使用 `forwardRef()`。
- 在 `recordJobRun()` 或运行时回调中调用 `runJob(job.instruction)`。
- 给后台执行失败补日志和错误隔离，避免一个任务异常影响 Scheduler。

## 十、下半部分补充：从可调度到可执行

下半部分的核心不是再加一个新 tool，而是把“可调度任务”升级为“可执行任务”。

前半段完成的是：

```text
用户说未来要做某事
  -> 模型选择 cron_job
  -> JobService 保存 Job
  -> SchedulerRegistry 注册运行时任务
```

这时任务已经可以到点触发，但触发后如果只打印 `job.instruction`，它还不是完整的 Agent 定时任务。

下半部分补上的最终链路是：

```text
SchedulerRegistry 到点触发
  -> JobService 取出 instruction
  -> JobAgentService.runJob(instruction)
  -> 模型绑定 send_mail / web_search / db_users_crud / time_now
  -> 根据 instruction 继续 tool call loop
```

这里有三个设计点要记住：

- `ToolModule` 必须抽出来，否则普通对话 Agent 和后台 JobAgent 会重复维护同一批工具。
- `JobAgentService` 不能绑定 `cron_job`，否则定时任务执行时可能继续创建定时任务，形成递归式自动化。
- `time_now` 不只是普通工具，它是把“10 分钟后”转成 `at` 时间点的前置能力。

当前源码和下半部分最终形态之间只差一个关键接线点：`JobService` 的运行时回调还没有调用 `JobAgentService.runJob(job.instruction)`。因此文档和注释都把它标成当前实现边界，而不是假装已经完成。

## 十一、代码阅读地图

| 文件 | 复习目的 |
| --- | --- |
| `src/app.module.ts` | 根模块、环境变量、邮件、MySQL、Schedule、业务模块组装 |
| `src/main.ts` | Nest 启动入口，当前没有全局校验管道 |
| `src/users/entities/user.entity.ts` | TypeORM 用户表映射 |
| `src/users/users.service.ts` | 数据库 CRUD 的真实执行层 |
| `src/tool/db-users-crud-tool.service.ts` | CRUD tool 的 schema 和 action 分发 |
| `src/tool/cron-job-tool.service.ts` | 定时任务 tool 的 schema 和 action 分发 |
| `src/tool/time-now-tool.service.ts` | 当前时间 tool |
| `src/tool/llm.service.ts` | ChatOpenAI 实例创建 |
| `src/tool/tool.module.ts` | tool 统一注册和导出 |
| `src/ai/ai.service.ts` | 用户请求 agent loop |
| `src/ai/ai.controller.ts` | 普通接口和 SSE 接口 |
| `src/ai/job-agent.service.ts` | 后台任务 agent loop |
| `src/job/entities/job.entity.ts` | 定时任务表结构 |
| `src/job/job.service.ts` | 持久化任务和运行时任务管理 |

## 十二、复习自检

读完本课后，应该能回答这些问题：

1. 为什么用户 CRUD 先做成 `UsersService`，再封成 `db_users_crud` tool？
2. `Entity`、DTO、Service、Controller 各自负责什么？
3. `cron`、`every`、`at` 三种任务分别对应什么自然语言表达？
4. 为什么“1 分钟后提醒我喝水”不能在当前轮立刻提醒？
5. 为什么 `instruction` 里不能写 `send_mail(...)` 这种工具调用脚本？
6. `SchedulerRegistry` 解决了什么问题？
7. 服务重启后，为什么需要从数据库恢复已启用任务？
8. 为什么后台 `JobAgentService` 不应该再注入 `cron_job`？
9. 当前源码离“到点后真正执行 agent loop”还差哪一步？
10. 如果 HTTP DTO 校验没有生效，应该检查 `main.ts` 的哪项配置？
11. 为什么下半部分要把 tool 抽成 `ToolModule`，而不是继续写在 `AiModule` 里？
12. `time_now` 在创建 `at` 类型任务时解决了什么问题？

## 十三、运行和验证注意事项

本课不是纯内存示例，验证时至少涉及四类外部条件：

- MySQL：`openclew` database、`User` 表、`Job` 表。
- 模型：`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MODEL_NAME`。
- 搜索：`BOCHA_API_KEY`。
- 邮件：SMTP 相关环境变量。

如果只复习 Nest 和 tool 结构，可以先不真实调用搜索和邮件；如果要完整验证自然语言任务，需要把这些外部配置补齐。

当前 `package.json` 依赖声明看起来没有完全覆盖源码 import。若 clean install 后构建失败，先核对 TypeORM、LangChain、zod、class-validator、mysql2 等依赖是否已列入并安装，再判断代码逻辑。
