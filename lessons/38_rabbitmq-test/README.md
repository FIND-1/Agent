# 第 38 课：RabbitMQ 与 Agent 异步处理

**外部前置条件 / TODO：需要可用的 RabbitMQ 服务；若采用 Compose，还需要用户自行准备 Docker 并确认 5672/15672 端口。当前仅做静态整理，没有启动容器、连接 Broker、验证收发消息或数据持久化。**

材料来自用户附件《RabbitMQ：Agent 中异步处理的标配方案》。本地当前只有 `docker-compose.yml` 与 `package.json`，没有文章所说的四类交换机源码。因此这是一份待补代码的复习入口，不是已经跑通的完整学习包。

## 这节要学什么

文档上传后先解析成 Markdown，再异步执行向量化入库与 ES 全文索引，避免解析接口同步等待所有下游步骤。本课讨论承担分发任务的 RabbitMQ，不包含文档解析、Milvus 或 ES 的实际实现。

消息路径：`Producer → Channel → Exchange → 绑定规则 → Queue → Consumer`。Connection 是客户端到 Broker 的 TCP 连接，Channel 是连接内的逻辑通道；消息最终在队列中等待消费。

| 阅读顺序 | 知识点 | 当前材料 / 源码状态 |
| --- | --- | --- |
| 前置 | Broker、端口、账号、vhost、挂载目录 | `docker-compose.yml` 已存在 |
| 00 | direct：routing key 精确匹配 binding key | 原始示例待补 |
| 01 | fanout：忽略 routing key，广播到所有绑定队列 | 原始示例待补 |
| 02 | topic：按点分段匹配，`*` 一个段，`#` 零到多个段 | 原始示例待补 |
| 03 | headers：匹配消息 headers 与绑定参数 | 原始示例待补 |

00–03 是**待补代码的学习顺序**，不是已存在文件名。拿到原码后，按实际 producer/consumer 文件数连续编号，保留文件名主体并记录原路径映射。Compose 是配套配置，不编号。

## 安装与运行：按依赖强度区分

### 1. 无需服务的静态检查

以下命令从仓库根执行：

```bash
node node_modules/prettier/bin/prettier.cjs --check lessons/38_rabbitmq-test/docker-compose.yml
```

目前没有 `src/*.mjs`，所以不能执行或宣称通过示例的 `node --check`。课程 package.json 原有 `test` 仍是失败占位脚本，不代表本课已有测试。

### 2. 无需模型 API Key

本课不调用模型。根目录已经安装 `amqplib@2.0.1`，从课程目录可以验证加载（不会建立连接）：

```bash
node --input-type=module -e "import amqp from 'amqplib'; console.log(typeof amqp.connect)"
```

预期输出 `function`。真实消息收发仍需 RabbitMQ 账号与可访问服务，不能把“无需模型 Key”等同于“离线可运行”。依赖由根 `package.json` 和 `pnpm-lock.yaml` 管理，不在课程内安装或维护 node_modules。需要恢复依赖时，仅在仓库根执行：

```bash
pnpm --filter agent-engineering-lab install --frozen-lockfile
```

### 3. Docker / RabbitMQ 外部服务（未执行）

原文 Compose 定义 `rabbitmq:3.13-management`：5672 用于 AMQP，15672 用于管理页面；vhost 为 `/`，账号配置见 Compose。`./rabbitmq_data` 是容器数据的主机挂载目录，不能据此认定所有消息已经持久化。

TODO：确认 Docker 可用、端口及容器名无冲突后，由用户决定是否在课程目录执行以下原文配套启动步骤：

```bash
docker compose up -d
```

管理页面为 `http://localhost:15672`。本轮没有执行上述命令，也没有接管已有容器。原文教学凭据不是生产配置；已有数据目录初始化之后，修改默认用户环境变量不等于修改 Broker 中已有用户。

### 4. 环境变量与源码缺口

当前没有客户端源码读取环境变量。Compose 里的 `RABBITMQ_DEFAULT_*` 是传给容器的配置，不是已经接入仓库根 `.env` 的客户端配置。本轮未读取或修改真实 `.env`，也不新增课程 `.env`。

后续原始客户端若需要配置地址/账号，应统一从**仓库根 `.env`**读取并复用 `@lessons/shared/env-loader`，届时按实际实现补齐变量名，不能现在编造已支持的配置项。上游课程使用的 amqplib 版本尚不明确，拿到源码后需核对与根目录 2.0.1 的兼容性。

### 5. 没有服务时如何复习

先读 Compose 的端口与 vhost，再看 [REVIEW_NOTES.md](./REVIEW_NOTES.md) 的四类路由对照，手工判断一条消息会进哪些队列。随后用双队列理解“分别做向量化与全文索引”。这条路径只需阅读，不新增假消费者、模拟 Broker 或 fallback 脚本。

## 常见失败与关键结论

- `ECONNREFUSED`：服务未就绪、主机/端口不对，或端口映射不可访问。
- 认证失败：账号、密码、vhost 或权限不匹配；管理页面能登录不代表所有 vhost 都有权限。
- `PRECONDITION_FAILED`：同名交换机/队列已存在，但声明类型或 durable 等属性不一致。先检查已有资源，不擅自删除。
- 消息未收到：检查绑定 key、交换机类型、发布时序和消费队列。无匹配绑定的消息不会自动等未来队列出现。
- direct 不是“只选一个队列”：多个队列绑定同一个 key 时，都可能收到消息。
- 两个消费者要分别执行两个任务，应使用两个队列；共用一个队列通常是竞争消费，不会各拿一份。
- 异步化降低请求等待，并不自动提供可靠性、幂等性、失败重试或 exactly-once。

原文源码定位、缺失项和整理检查结果见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。
