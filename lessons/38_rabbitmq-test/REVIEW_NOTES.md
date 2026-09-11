# 第 38 课复习记录

**外部前置条件 / TODO：Docker 与 RabbitMQ 服务可用性未验证。没有执行容器启动、消息收发、持久化、Milvus/ES 入库，也没有运行任何常驻服务。**

当前仅有 Compose 和 package.json，没有 direct/fanout/topic/headers 的 JS/MJS/TS 文件；四类交换机的代码路径和运行结果仍待补充，本文只记录可复习的路由规则。

## 文章知识主线

问题：解析后的 Markdown 需要两条下游处理链，接口没有必要等待向量化与全文索引全部结束。MQ 可以解耦解析服务与后台任务，消费者独立处理，但状态跟踪、重试和幂等仍需要应用实现。

| 概念 | 作用 | 容易混淆的点 |
| --- | --- | --- |
| Producer | 发布任务消息 | 通常发给交换机，再路由到队列 |
| Broker | RabbitMQ 服务实例 | 不是某一条队列 |
| Connection | TCP 连接 | 不应每条消息都重新建立连接 |
| Channel | 连接内的逻辑通道 | 通道不等于消息队列 |
| Exchange | 按类型与绑定规则路由 | 不承担队列式消息积压存储 |
| Queue | 保存等待消费的消息 | 同队列多个消费者通常分担任务 |
| Consumer | 接收并处理消息 | 收到、处理完成与确认是不同步骤 |

## 四类交换机：先预测路由，再看源码

以下是解释规则的表格，不是实际运行结果，也不是新增代码示例。

| 类型 | 绑定示意 | 发布消息示意 | 预期路由 |
| --- | --- | --- | --- |
| direct | A 绑定 `doc.ready`，B 绑定 `doc.failed` | key=`doc.ready` | A；如果其他队列也绑定同 key，也可收到 |
| fanout | A/B 都绑定该交换机 | 任意 key | A/B，各队列一份 |
| topic | A=`doc.*`，B=`doc.#` | key=`doc.pdf.ready` | B；`*` 只能匹配一个段 |
| topic | 同上 | key=`doc` | B；`#` 可匹配零段 |
| headers | A：`x-match=all, format=pdf, task=index` | headers 同时含 format=pdf 与 task=index | A；routing key 不参与匹配 |

headers 常用 `x-match=all` 表示所有绑定条件满足，`any` 表示至少一项满足；这是补充说明，原文只概述按 header 匹配。topic 按 `.` 分段，并不是任意字符正则匹配。

推荐未来阅读每个示例时定位：`connect → createChannel → assertExchange/assertQueue → bindQueue → publish/consume → ack/close`。具体 API 是否出现以及如何使用必须以补入的原始源码为准；当前不能认定已有手动 ack 或连接关闭实现。

## 与 Agent/RAG 的对应

假设 Markdown 解析成功后发一条消息，向量消费者和 ES 消费者各需要处理一次，应让两个独立队列绑定同一交换机；fanout 可以广播事件，direct/topic 可以进一步按任务或文档类型筛选。一个队列上启动两个消费者通常是负载分担，而不是完成两种业务。

文章“后端异步任务基本都通过 MQ”是场景化概括。MQ 是常见方案，但不是唯一方案；本课也没有实现可生产使用的 RAG 管道。

可靠性相关的后续问题：生产者 confirm、不可路由消息处理、队列 durable 与消息 persistent、消费者 ack/nack、prefetch、失败重试/死信、幂等与重复投递。它们用于界定本课范围，本轮不新增对应教学脚本。

## 原路径与整理范围

| 原文 / 当前路径 | 本轮路径 | 处理 |
| --- | --- | --- |
| `docker-compose.yml` | `docker-compose.yml` | 保留名称与配置值；追加端口、外部环境及持久化边界注释 |
| `package.json` | `package.json` | 补充准确描述；保留原有脚本，不伪造缺失的运行入口 |
| 四种交换机代码：正文未列具体文件名 | 待提供 | 收到后按 direct → fanout → topic → headers 连续编号，并保留 basename |

当前按名称升序的文件：

```text
38_rabbitmq-test/
├── docker-compose.yml
├── package.json
├── README.md
└── REVIEW_NOTES.md
```

Compose 为配套配置，package.json 为包配置，Markdown 为文档，均不参与脚本编号。没有可编号脚本，**不是以文件少为由豁免编号**；待源码补齐后必须实际编号，不能只保留文档顺序。未创建空 src 或空 _shared 冒充完成。

## 共享抽离与依赖检查

- 已搜索 lessons 范围的 amqplib、RABBITMQ_URL、amqp.connect 引用：本轮开始时未发现客户端源码，也没有等价 RabbitMQ 共享初始化需要迁移。
- 当前无重复模型、环境读取、schema、prompt、examples 或日志工具函数；不新建空共享模块。拿到原码后再按实际使用文件数检查，必要共享超过 3 文件必须放到 lessons/_shared。
- 根 amqplib@2.0.1 与锁文件由前一轮安装，本轮不重复安装、不升级依赖。课程复用根 node_modules，没有独立依赖目录。
- README 说明根 `.env` 统一配置原则，同时明确当前 Compose 是内联容器变量，客户端尚未接入；没有创建新的 .env 或修改真实 Key。

## 自检与未完成项

已完成：文章与现有配置对照、两份复习文档、Compose 复习注释、依赖与离线阅读分类。原有 Compose 没有源码注释可迁移；新增注释保留配置原意，未删除文章提供的配置字段。

2026-09-10 静态检查：

- Prettier 对 Compose YAML 与 package.json 的解析/格式检查通过。
- 在课程目录导入 amqplib 并验证 connect 为函数，通过；没有调用 connect。
- 实际按名称列出目录：与上述四文件结构一致，课程根仅 README/REVIEW_NOTES 两份 Markdown。
- 课程递归检查未发现嵌套 .git、node_modules 或空 _shared。
- 无编号脚本，故不存在编号示例之间的 import 或旧脚本路径残留；文件编号与逐脚本 node --check 均因源码缺失待完成，不能标为已通过。
- 无需 Key 的静态检查/依赖加载、无模型 API、需 RabbitMQ/Docker 的执行路径和无服务复习路径均已分类。没有新增 fallback 或压缩包。

待用户提供：文章所说的 direct、fanout、topic、headers 原始示例。收到后才能完成 src 学习包、真实旧新路径映射、连续编号、共享抽离复核与逐文件 node --check。当前不宣称完整学习代码包已交付。
