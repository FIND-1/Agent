# 34 · Mem0 分层记忆

> 外部前置条件 / TODO：Redis、Mem0 自托管服务及其数据库尚未纳入运行验证。目录中已有 Docker 配置和 Mem0 源码，不代表服务可用。本次仅做语法、静态和离线检查，没有启动服务、调用模型或写入/删除远程记忆。

学习目标：理解 Mem0 如何从对话提取记忆，用身份字段控制检索范围，再把长期记忆与 Redis 短期历史接入 Agent。先掌握云端 API，再看综合链路，最后研究自托管。

## 学习顺序

| 顺序 / 文件                                                          | 解决的问题                                                    | 运行依赖                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| [00-mem0-test.mjs](src/00-mem0-test.mjs)                             | add、search、getAll、get、update、history、deleteAll 基础 API | Mem0 云端 Key、网络                |
| [01-mem0-scoped-memory-test.mjs](src/01-mem0-scoped-memory-test.mjs) | 用户、会话、Agent 三种身份维度；分开 add 与 search            | Mem0 云端 Key、网络                |
| [02-mem0-redis-mem0-agent.mjs](src/02-mem0-redis-mem0-agent.mjs)     | Redis 历史 + Mem0 召回 + 摘要 + 分类写入                      | Redis、Mem0 云端、模型 API         |
| [03-mem0-local-pai-demo.mjs](src/03-mem0-local-pai-demo.mjs)         | 用 fetch 调用自托管 REST 接口                                 | 外部 Mem0 服务、其数据库和模型配置 |

原文路径映射和详细复习记录见 [REVIEW_NOTES.md](REVIEW_NOTES.md)。`pai` 是原文件名的一部分，本次仅加编号。

## 安装与环境

使用 Node.js 22+；依赖统一在仓库根目录安装，课程内不维护 `node_modules`：

```powershell
# 在 D:/1project/agent 执行
pnpm install
```

课程 `package.json` 只提供入口脚本；依赖清单由根包管理：`mem0ai`、`ioredis`、`langchain`、`@langchain/core`、`@langchain/openai`、`zod`、`dotenv`、`@lessons/shared`。本课不是脱离仓库即可安装的独立包。

四个示例通过共享加载器读取**仓库根 `.env`**，与启动时工作目录无关；不需要创建本课 `.env`。

| 变量                                                               | 使用位置 / 默认值                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `MEM0_API_KEY`                                                     | 00、01、02 必填，Mem0 Platform 云端密钥                            |
| `OPENAI_API_KEY`、`MODEL_NAME`                                     | 02 的回答、分类、摘要模型配置；需支持结构化输出                    |
| `OPENAI_BASE_URL`                                                  | 02，可选兼容模型端点；未设置时使用 SDK 默认端点                    |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB`                           | 02，默认 `localhost` / `6379` / `0`                                |
| `MEMORY_TTL_SECONDS`                                               | 02，默认 `1800`，每次写回刷新 Redis TTL                            |
| `MEMORY_KEY_PREFIX`                                                | 02，默认 `agent:short_memory`；建议本课独立前缀，避免与 33 课冲突  |
| `MEMORY_SESSION_ID`                                                | 02，默认 `session_001`，同时用于 Redis key 和 Mem0 runId           |
| `MEM0_USER_ID`                                                     | 02，默认 `demo_user_001`；00 / 01 / 03 使用各自代码中的固定演示 ID |
| `MEM0_TOP_K`                                                       | 02、03，默认 `5`；请使用正整数                                     |
| `MEM0_LOCAL_BASE_URL`                                              | 03，默认 `http://localhost:8888`，必须指向用户准备好的自托管服务   |
| `MEM0_LOCAL_API_KEY`                                               | 03，按服务认证要求提供，通过 `X-API-Key` 发送                      |
| `LANGCHAIN_API_KEY` / `LANGCHAIN_PROJECT` / `LANGCHAIN_TRACING_V2` | 原文可选 LangSmith 追踪配置，不是记忆系统必需项                    |

自托管服务有独立的服务端环境配置，客户端根 `.env` 不会自动配置服务器。文章的 PostgreSQL、模型、认证等设置属于外部部署 TODO，详见复习记录。

## 检查与运行

### 无需 Key、无需外部服务

四个入口都需要外部服务才能完整演示，**没有无需 Key 且完全离线的业务示例**；语法检查不需要任何 Key，也不会执行入口：

```powershell
# 在仓库根执行；逐个 --check，不依赖 shell glob
node --check lessons/34_mem0-test/src/00-mem0-test.mjs
node --check lessons/34_mem0-test/src/01-mem0-scoped-memory-test.mjs
node --check lessons/34_mem0-test/src/02-mem0-redis-mem0-agent.mjs
node --check lessons/34_mem0-test/src/03-mem0-local-pai-demo.mjs
node --check lessons/_shared/mem0-client.mjs
```

也可在课程目录执行 `pnpm run check`。pnpm 可能根据工作区状态自动同步依赖；本次检查使用中确实发生过，生成的本课依赖目录已清理，日常只做静态复习时可优先用上面的 Node 命令。

### Mem0 云端示例

以下命令在课程目录执行，配置可用云端 Key 后再运行：

```powershell
node src/00-mem0-test.mjs
node src/01-mem0-scoped-memory-test.mjs add
# 等待云端抽取完成，再单独运行 search；等待几秒不保证必定完成
node src/01-mem0-scoped-memory-test.mjs search
```

00 保留已有代码的“默认只查询”行为：写入样本、add、update、history 是注释教学段。要验证写入，手动启用 `conversation` 样本块及 add 两行；update / history 独立启用。00 的演示城市保留当前代码的上海，03 保留文章的北京。

00 的 `--cleanup` 会先执行查询再删除 `demo-user` 全部记忆；01 的 `--cleanup` 删除演示用户范围与 Agent 范围。它们不是只删除本次运行新建的数据。01 无参数默认 `add`。本次没有执行这些业务命令。

### 需要模型 API / Redis 的综合示例

外部服务准备好后，在课程目录手动执行 `node src/02-mem0-redis-mem0-agent.mjs`（或 `pnpm run agent`）。

- `:clear`：删除当前 Redis 会话历史。
- `:clear-mem0`：按用户删除 Mem0，可能覆盖该用户所有会话，随后还会删除当前 run 范围。
- `exit` / `quit` / `:q`：退出交互。
- 重启进程不会自动清空 Redis；同一 session ID 且 TTL 未过期时仍会恢复历史。

`docker-compose.yml` 保留文章的 Redis 和可选 RedisInsight 配套配置。原文 `docker compose up -d redis` 仅作为外部准备步骤，不是本次已执行命令；默认端口 6379 / 5540 由用户管理。

### 自托管 API（外部前置条件 / TODO）

只有用户准备好 Mem0 服务与数据库后，才在课程目录运行：

```powershell
node src/03-mem0-local-pai-demo.mjs add
node src/03-mem0-local-pai-demo.mjs search
node src/03-mem0-local-pai-demo.mjs list
```

03 无参数默认写入；`--cleanup` 删除 `local_api_demo` 用户范围。无需客户端 OpenAI Key 不等于离线运行：抽取与 embedding 在服务端仍依赖模型。自托管源码保留于 `mem0/`，本次不调整其安装、认证或数据库配置。

## 关键结论与常见问题

- `add` 通常提炼事实，不是直接保存完整聊天记录；异步提交成功不等于立即可检索。
- `search` 返回相关记忆，不是最终对话回答；查询中写“中文回答”不能保证记忆存储语言或输出语言。
- `userId` / `runId` / `agentId` 是写入身份维度，过滤字段使用 `user_id` / `run_id` / `agent_id`。**仅过滤 user_id 不保证排除 session 记忆**，当前代码尚非严格分层实现。
- Redis 保存连续对话与摘要，Mem0 保存抽取后的信息；Redis TTL 不会自动清除 Mem0。
- 文章“三路召回 + 重排”需按版本核对。当前源码可见语义候选、BM25、实体关联加权与可选 reranker，不能据此宣称默认具有图谱多跳推理，云端实现也未验证。

| 现象                   | 排查 / 复习办法                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| `ERR_MODULE_NOT_FOUND` | 检查根目录依赖是否安装，不要在课程目录另装一套                           |
| 缺少 Key、401 / 403    | 检查根 `.env`、云端与本地 Key 的区别、服务认证                           |
| 429 / 调用次数限制     | 检查平台配额；停止重复 add，用文档和源码复习                             |
| add 后搜不到           | 抽取可能未完成、未形成有效事实、身份不一致或相关性不足；配合 getAll 检查 |
| Redis / fetch 连接失败 | 外部服务未准备或地址端口不匹配；不自动启动或重启用户服务                 |
| Agent 分类失败         | 检查模型是否支持结构化输出；Redis 可能已写回，Mem0 尚未写入              |
| 换会话仍召回旧任务     | user_id 宽过滤与整轮双写的边界，见 REVIEW_NOTES，不应当成隔离成功        |

无服务时的最小复习路径：读 00 的参数 → 01 的过滤器 → 02 的 `invokeWithMemory`、分类 schema 与 TTL → 03 的 HTTP 参数映射，最后再读自托管搜索源码。无需先搭完 Docker，也没有新增原文之外的 fallback 示例。
