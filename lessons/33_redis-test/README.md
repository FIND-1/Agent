# Lesson 33：Redis 与 Agent 短期记忆

> **当前未配置 Redis 环境。** 本课是待接入的教学代码，仅执行离线检查；Redis 读写、TTL、摘要调用和 Docker 部署均未验证。`docker-compose.yml` 的存在不代表服务已启动。

## 复习顺序

1. 阅读 [复习记录中的数据类型手册](./REVIEW_NOTES.md#redis-核心数据类型手册)，理解 String、Hash、List、Set、ZSet 的选择依据。
2. 阅读 [基础操作](./src/00-redis-test.mjs)：连接 → 各类型写入与读取 → SET NX EX → 释放连接。
3. 阅读 [会话记忆](./src/01-agent-with-redis-memory.mjs)：消息存取 → Agent 调用 → 摘要中间件 → TTL。
4. 用 [复习与检查记录](./REVIEW_NOTES.md) 自测，再查看环境接入待办。

原文为用户指定的桌面 `SUMMARY_RULES.txt`，正文标题是《Redis：实现 Agent 短期记忆存储的最佳方案》；整理规范来自仓库根 `SUMMARY_RULES.md`。学习顺序为：多实例共享会话问题 → Redis 类型与命令 → ioredis 基础操作（00）→ Agent 短期记忆（01）。

## 文件与知识点

| 文件 | 学习重点 |
| --- | --- |
| `src/00-redis-test.mjs` | ioredis 的 set/get、hset/hgetall、lpush/rpush/lrange、sadd/smembers、zadd/zrange |
| `src/01-agent-with-redis-memory.mjs` | RedisMessageStore、消息序列化、会话隔离、summarizationMiddleware |
| `REVIEW_NOTES.md` | 原文路径映射、命令速查；Bitmap、Geo 等仅为文档示例 |
| `docker-compose.yml` | Redis 7 + RedisInsight 的外部环境模板，待接入 |
| `package.json` | 离线语法检查与手动示例入口 |

## 基础操作要点

- 示例键统一加 `lesson33:demo:` 前缀，避免覆盖原先无命名空间的 `name` 等键。仍应使用独立练习实例。
- `SET ... EX 300` 设置整个键的过期时间；普通 SET 不会自动保留旧 TTL。
- 空列表上 `LPUSH 任务1 任务2` 后再 `RPUSH 任务3`，顺序是任务2、任务1、任务3。重复运行会继续追加。
- Set 去重且不保证输出顺序；ZSet 的 `ZRANGE` 默认按分数从低到高，所以示例先小红（95）、后小明（99）。
- `SET NX EX` 返回 `OK` 或 `null`。固定值 `locked` 只演示加锁原语，没有安全释放、续租和业务临界区。
- 示例保留练习数据，不执行清库；List 会累积，其他键也可能影响再次运行的结果。

## Agent 记忆执行链路

```text
用户输入
  → loadMessages(sessionId)：GET → JSON.parse → 恢复 LangChain 消息
  → 历史消息 + HumanMessage
  → agent.invoke：摘要中间件检查触发条件 → 模型回答
  → saveMessages：转换 StoredMessage → JSON.stringify → SET EX
  → 输出回答与剩余 TTL
```

记忆存储使用 **String 中的 JSON 数组**，并非 Redis List。键为
`{MEMORY_KEY_PREFIX}:{MEMORY_SESSION_ID}:messages`，默认是
`agent:short_memory:demo_user_001:messages`。

每次成功写回刷新 TTL（默认 1800 秒）；读取不会续期。过期后 `GET` 返回空，代码恢复为空历史。TTL 查询中的 `-2` 表示键不存在，`-1` 表示没有过期时间。

摘要中间件配置 `trigger: { messages: 8 }`、`keep: { messages: 4 }`。它在 Agent 内检查消息数量并压缩较早上下文，不等于“第 8 轮对话必定摘要”。保留范围还受消息边界及当前 LangChain 实现影响。消息数下降仅能作为观察线索，不能单独证明摘要执行成功。

这是手动加载与写回，不是 LangGraph checkpointer：不保存完整图执行状态，也没有自动故障恢复。相同会话同时调用可能发生后写覆盖前写；模型成功但 Redis 写入失败时，该轮结果也可能丢失。摘要可能遗漏事实，不等于长期事实记忆。

## 当前可执行的离线检查

在项目根目录运行：

```powershell
npm --prefix lessons/33_redis-test run check
```

该命令只解析两个示例及共享配置 `.mjs` 文件，不执行顶层代码、不连接 Redis、不请求模型。它不是类型检查或集成测试；根目录 TypeScript 配置也不覆盖本课 `.mjs`。

### 按运行依赖分类

| 入口 | API Key | 外部服务 | 常见失败与复习替代路径 |
| --- | --- | --- | --- |
| `check` | 不需要 | 不需要 | 无环境时先做语法检查，再按 00 → 01 阅读 |
| `demo:redis`（00） | 不需要 | Redis | ECONNREFUSED / 连接超时：核对连接配置，先对照本文和命令手册推演读写 |
| `demo:memory`（01） | 需要 | Redis + 模型 API | 401 / 模型不存在：核对模型配置；Redis 错误先停在 loadMessages，离线阅读 load → invoke → save |

当前没有完全不依赖外部服务的业务运行示例，也未增加原文之外的 fallback 文件。

## 外部前置条件 / TODO

当前仅保留以下接入说明，未执行服务启动：

1. 由用户准备可用的 Redis 实例。现有 Compose 模板使用 6379（Redis）和 5540（RedisInsight），启用 AOF 并挂载 `volumes/`；端口、目录和容器名称需先确认无冲突。模板未配置认证，不作为生产部署配置。
2. 示例复用仓库根依赖，不是可复制到空目录后直接运行的独立 npm 包。需要现有 `ioredis`、`langchain`、`@langchain/core`、`@langchain/openai`、`dotenv` 和 `@lessons/shared` 依赖可用。
3. 两个入口通过共享 env-loader 读取根目录 `.env`，进程环境变量优先。此次未修改真实配置。

| 配置 | 默认值 / 用途 |
| --- | --- |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB` | `localhost` / `6379` / `0`，两个脚本共用 |
| `MEMORY_TTL_SECONDS` | `1800`，应为正整数秒 |
| `MEMORY_KEY_PREFIX` | `agent:short_memory`，仅记忆脚本使用 |
| `MEMORY_SESSION_ID` | `demo_user_001`，不同会话需不同 ID |
| `MODEL_NAME` / `OPENAI_API_KEY` | 记忆脚本所需模型配置 |
| `OPENAI_BASE_URL` | OpenAI 兼容接口地址，按所选服务配置 |

当前连接配置未接入密码或 TLS，也没有完整的参数校验；如外部实例要求这些配置，需先补齐再运行。

环境准备完成后才手动执行：

```powershell
npm --prefix lessons/33_redis-test run demo:redis
npm --prefix lessons/33_redis-test run demo:memory
```

记忆示例支持 `exit`、`quit`、`:q` 退出，`:clear` 删除当前会话记忆键。连接使用延迟连接、5 秒连接超时并关闭自动重连，失败返回非零退出码，收尾断开连接。

后续验证：检查基础类型读写；同一 session 重启后续聊；不同 session 隔离；短 TTL 到期后恢复空历史；多轮对话触发摘要；`:clear` 后重新询问；连接失败后进程退出。以上均为 **待验证**，不代表本次已通过。

