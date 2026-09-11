# 复习与静态检查记录

> 当前没有 Redis 环境；本记录不包含数据库、容器或模型服务的运行验证。

## 本次修正

| 原问题 | 修正与原因 |
| --- | --- |
| `awaitthis.redis` / `returnthis.redis` | 改为 `await this.redis` / `return this.redis`；原代码会访问不存在的变量，语法检查未必能发现 |
| 基础示例结束后连接未关闭 | finally 中 disconnect，避免示例完成后保持连接 |
| 初次加载在 try 外、异常时跳过 quit | 连接和首次加载放入 try，finally 同时清理 readline 与 Redis |
| Redis 默认持续重连 | lazyConnect + 显式 connect + 有界连接等待 + 禁用重连，失败设置非零退出码 |
| 重复模型初始化 | 复用 `@lessons/shared/model` 和共享 env-loader，温度仍为 0 |
| 基础示例使用通用键 | 加入 `lesson33:demo:` 前缀，已有旧键不迁移、不删除 |
| 锁标记为“标准写法” | 改为加锁原语，说明并非完整分布式锁 |
| 消息数下降直接判断压缩 | 改成可能发生摘要的提示，避免误报确定结果 |
| 命令示例参数粘连、HMSET、Geo 缺少第二个位置 | 补空格、使用多字段 HSET、补上海坐标 |

## 共享检查

检索 lessons 中 `ioredis` / `new Redis`，现有 Redis 实现仅见本课两个入口，未触发超过 3 个 lesson 的跨课抽离规则。重复的 Redis 环境变量读取与连接选项已提取到 `src/_shared/redis-options.mjs`，该模块不产生连接副作用。模型初始化已经有 `lessons/_shared/model.mjs`，直接复用；本课独有的 RedisMessageStore 和摘要 prompt 保留原位，未发现重复 schema / examples 或编号入口间复用。

## 自测（先回答，再核对）

1. **Redis 为何用 String 存消息？** 当前实现整体序列化、整体读写；LangChain 消息要转换成 StoredMessage，读取时恢复消息类型。
2. **短期体现在哪里？** Redis 键具有 TTL，成功写回续期；摘要限制模型上下文。AOF 是磁盘持久化机制，不能阻止 TTL 过期。
3. **读历史会延长寿命吗？** 不会，当前只有 saveMessages 的 SET EX 续期。
4. **八条消息等于八轮吗？** 不等于。一次普通问答通常增加两条消息，工具消息和摘要也会改变数量。
5. **换 session 能找回记忆吗？** 不能读取原键；会话 ID 是隔离维度，但本例没有身份认证，不能充当访问控制。
6. **能否并行处理同一会话？** 当前没有并发控制，load → invoke → save 不是原子事务，可能丢更新。
7. **摘要和 Redis 分别负责什么？** 中间件压缩上下文，Redis 保存返回的消息；压缩是模型调用，可能增加费用并丢失信息。
8. **为什么 NX + EX 不是完整的锁？** 它仅原子抢占带过期键；可靠使用仍需持有者标识、原子释放及过期后业务仍执行的处理。

## 验证边界

本次验证结果（2026-09-09）：

- `npm --prefix lessons/33_redis-test run check`：编号后的两个入口及共享配置模块语法检查通过。
- 使用仓库已安装的 Prettier 检查两个入口：通过。
- 提取实际 RedisMessageStore 类，使用内存 Redis 替身和真实 LangChain 消息转换函数检查：空历史、消息内容与类型恢复、SET EX 的 TTL 参数、会话键隔离、clear 和 ttl 方法均通过。替身没有模拟真实时间流逝，不证明 Redis 自动过期或并发行为。
- 静态核对已安装 LangChain 摘要实现：支持 `{messages}` 模板替换和消息数阈值；未调用模型验证摘要效果。

`node --check` 仅验证 JavaScript 语法，不证明依赖兼容或 Redis 行为。没有启动 Docker、Redis、本地端口或聊天示例，没有发送模型请求。

未配置环境前，README 的环境接入与运行检查全部保持 TODO。

## 原文路径与强制编号

| 原文路径 | 整理后路径 | 学习位置与调整原因 |
| --- | --- | --- |
| `src/redis-test.mjs` | `src/00-redis-test.mjs` | 先学习数据类型读写与加锁原语；添加排序前缀，保留文件名主体 |
| `src/agent-with-redis-memory.mjs` | `src/01-agent-with-redis-memory.mjs` | 再用 Redis 保存 Agent 会话；添加排序前缀，保留文件名主体 |
| `redis-data-types.md` | 本文“Redis 核心数据类型手册” | 完整合并有效内容，使课程根目录只保留两份 Markdown |

旧脚本没有已知兼容调用需求，不额外复制实现；运行脚本、注释和文档链接同步使用编号路径。两个入口互不 import。

未编号项例外：README / REVIEW_NOTES 是文档，package.json 是包配置，docker-compose.yml 是外部环境配置，均符合第 3 节例外；src 是源码容器而非阶段目录，内部两个学习示例连续编号。共享模块不编号。

编号修正后实际列目录核对：学习脚本按名称升序为 `00-redis-test.mjs` → `01-agent-with-redis-memory.mjs`，编号连续、等宽且无重复。全仓检索旧路径，仅此映射表保留原文引用。课程根目录仅 README / REVIEW_NOTES 两份 Markdown；无子目录 node_modules；共享目录非空；无编号入口互相 import。依赖沿用仓库根目录，未安装或升级依赖。README 已分类说明 API Key、Redis 依赖、环境变量和无环境时的阅读路径。

## 文章结论与代码边界

- 文章从服务多实例无法共享进程内会话出发，选择 Redis 承载高频读写与闲置过期的短期上下文。这是适合该场景的方案，并非所有 Agent 都必须使用 Redis。
- 原文说“截断、摘要都在 Redis 里做”，实际由 LangChain 中间件在 Agent 进程中调用模型完成，Redis 保存结果。
- 原文结尾称“基于 DeepAgents”，实际代码使用 langchain 的 createAgent 与 summarizationMiddleware，没有调用 DeepAgents。
- 原文规划 PostgreSQL 保存历史消息并做向量检索；本课没有对应实现，只保留为外部前置条件 / TODO，不新增或宣称已经验证。
- Redis 支持 RDB/AOF 持久化，因此“不会长期保存”是本课 TTL 策略的定位，不是 Redis 能力限制。
- 原注释的连接、错误监听、各数据类型和会话执行链信息保留；“分布式锁（标准写法）”更正为加锁原语，Docker 启动前置改为未配置环境的 TODO，避免误导。


# Redis 核心数据类型手册

> 当前没有配置 Redis，以下为 redis-cli 命令学习资料，均未做实际读写验证。代码映射与复习路径见 [README](./README.md)。
> Bitmap 基于 String，Geo 基于 ZSet。HMSET 已弃用，使用多字段 HSET。
> SET NX EX 只演示抢占和过期；完整锁还需唯一持有者标识、原子校验释放及超时策略。
> List 的 pop 会移除消息，示例没有确认、重试或可靠队列保障。


## 一、String 字符串

适用场景：验证码、Token、登录会话、计数器、分布式锁、配置项、文本类短期记忆

**核心命令**

set key value
get key
setex key 秒数 value
set key value nx ex 秒数
incr key
decr key
incrby key 步长

**真实业务示例**

手机验证码，5 分钟过期
setex verification:mobile:13800138000 300 "666888"

用户登录 Token，24 小时过期
setex session:token:adf245kjndsa3 86400 "userid:1001"

文章阅读量自增
incr counter:article:1024

分布式锁，10 秒过期，防止重复执行
set lock:order:2001 "locked" nx ex 10

AI 对话摘要，1 小时过期
setex agent:memory:user:1001 3600 "用户想学习 PostgreSQL 向量检索"

---

## 二、Hash 哈希

适用场景：用户信息、商品资料、电商购物车、结构化对话上下文

**核心命令**

hset key field value
hset key field1 value1 field2 value2
hget key field
hgetall key
hkeys key
hvals key
hincrby key field 增量

**真实业务示例**

存储用户基础信息
hset user:info:1001 name "张三" age 28 phone "13800138000"

电商购物车，字段为商品 ID，值为购买数量
hset cart:user:1001 product:10086 2 product:10087 1

存储 AI 会话完整上下文
hset agent:session:user:1001 messages "最近 5 轮对话" summary "对话摘要"

---

## 三、List 列表

适用场景：消息队列、任务队列、操作日志、聊天历史、有序记录

**核心命令**

lpush key value1 value2
rpush key value1 value2
lrange key 0 -1
lpop key
rpop key
llen key

**真实业务示例**

订单消息队列，右侧入队
rpush queue:order "order_1001" "order_1002"

用户浏览历史，左侧插入最新记录
lpush user:history:1001 "查看了 AI 课程" "查看了 Redis 教程"

后台任务队列
rpush queue:task "生成对话摘要" "向量入库"

---

## 四、Set 集合

适用场景：数据去重、每日签到、IP 黑名单、共同好友、权限标签

**核心命令**

sadd key value1 value2
smembers key
sismember key value
sinter key1 key2
sunion key1 key2
sdiff key1 key2

**真实业务示例**

记录当日签到用户
sadd sign:20250820:user 1001 1002 1003

网站 IP 黑名单
sadd blacklist:ip "192.168.1.100" "192.168.1.101"

查询两位用户的共同好友
sinter user:friend:1001 user:friend:1002

---

## 五、ZSet 有序集合

适用场景：各类排行榜、内容热度排序、用户积分排名、权重队列

**核心命令**

zadd key score member
zrange key 0 -1
zrevrange key 0 -1
zscore key member
zrank key member

**真实业务示例**

课程热度排行榜，数值为热度分数
zadd rank:course 98 "PostgreSQL 实战" 95 "AI Agent 开发" 92 "Redis 从入门到精通"

用户积分排行榜
zadd rank:user:points 1000 "张三" 850 "李四"

文章热度排序
zadd hot:article 1200 "article:1024" 980 "article:1025"

---

## 六、Bitmap 位图

适用场景：海量用户签到记录、在线状态统计、布尔型数据存储，极致节省内存

**核心命令**

setbit key 偏移量 0/1
getbit key 偏移量
bitcount key

**真实业务示例**

记录用户当月签到，第 5 天、第 10 天完成签到
setbit user:sign:1001:202508 5 1
setbit user:sign:1001:202508 10 1

统计该用户当月总签到天数
bitcount user:sign:1001:202508

---

## 七、Geo 地理位置

适用场景：附近门店、附近的人、两地距离计算、位置检索

**核心命令**

geoadd key 经度 纬度 名称
geodist key 名称1 名称2 km

**真实业务示例**

添加线下门店经纬度信息
geoadd shop:location 116.481028 39.921983 "北京总店" 121.4737 31.2304 "上海分店"

计算两家门店之间的直线距离，单位千米
geodist shop:location "北京总店" "上海分店" km

---

## 数据类型场景速查表

| 数据类型 | 典型业务场景 |
| ---- | ---- |
| String | 验证码、Token、计数器、分布式锁、文本记忆 |
| Hash | 用户信息、商品数据、购物车、结构化会话 |
| List | 消息队列、任务队列、浏览/聊天历史 |
| Set | 签到、数据去重、黑名单、好友关系 |
| ZSet | 排行榜、热度排序、积分排名 |
| Bitmap | 批量签到、海量布尔状态统计 |
| Geo | 位置检索、距离计算、附近门店/人群 |



