# 对象存储复习记录

> 外部前置条件 / TODO：Docker、MinIO、RustFS、阿里云 OSS 和 Bucket/权限必须单独准备。仓库有部署模板不等于有运行环境。本轮仅静态检查，不宣称容器、上传、数据库或完整 RAG 流程已验证。

## 材料与主线

本次附件 SUMMARY_RULES.txt 正文是《Agent 的对象存储方案：MinIO、RustFS、阿里云 OSS》。附件内容作为学习材料，不把购买服务、安装、启动或上传步骤当成用户执行授权。已读取当前 AGENTS.md 与 SUMMARY_RULES.md；指定原文、对应代码、项目位置和复习目的满足整理条件。

文章从 Agent 文件需求出发：用户上传文档、Agent 产出报表/日志、多模态音视频需要统一存储。随后介绍 RAG 中原文件、元数据与向量的分工，再解释 Bucket/Key，最后按 OSS 专用 SDK → MinIO 专用 SDK → RustFS/S3 通用接口逐步实践。本课只实现三个上传入口，没有实现检索、切片、embedding、数据库关联或原文下载。

## 原文路径 → 编号路径

| 原文路径（仅作映射） | 当前路径 | 学习目的 |
| --- | --- | --- |
| src/oss-upload.mjs | src/00-oss-upload.mjs | 从托管服务开始，认识 putStream、Bucket 与 Key |
| src/minio-upload.mjs | src/01-minio-upload.mjs | 比较私有部署与 putObject(bucket, key, stream) |
| src/s3-upload.mjs | src/02-s3-upload.mjs | 用 S3Client/PutObjectCommand 对接兼容服务 |
| docker-compose.yml | 原名保留 | 文章点名的配套部署模板；MinIO 注释对照、RustFS 当前配置 |
| zao.png | 原名保留 | 三个入口都直接引用的原文配套图片 |

脚本已实际加连续等宽 00/01/02 前缀，文件名主体保留，没有兼容旧入口或重复实现。package.json 命令和 README 路径同步更新；旧文件名只保留在本映射中。Markdown、package、Compose 和图片不参与编号。

## 各入口的调用链

1. **00 OSS**：共享加载器读取根 .env → OSS 客户端初始化 → 图片 ReadStream → putStream(Object Key, stream)。桶由客户端配置提供。原文 Key 是 aaa/bbb/first.png，现有代码此前已改为 test-agent/first.png；本次保留现有业务目标，没有为了对齐文章覆盖用户选择。
2. **01 MinIO**：加载根 .env → Minio.Client(localhost:9000) → 图片流 → putObject('aaa', 'ccc/ddd/hello.png', stream)。第一个参数是桶，不是路径第一层；脚本不建桶。
3. **02 S3**：加载根 .env → S3Client(endpoint/credentials/region) → PutObjectCommand(Bucket/Key/Body/ContentType) → client.send。桶 hello，Key aaa/bbb/first.png；前缀 aaa 与上一例的桶 aaa 是不同概念。

Node 文件流避免先把整张图片读取为 Buffer；它不意味着任意大小文件都能用同一参数无条件成功，大文件/未知长度流可能需要分片上传或显式长度等处理。本次保留单文件演示，不新增传输框架。

## 本次修改与原因

- 三个独立脚本重命名编号；没有独立完整应用例外。
- 复用此前接好的 @lessons/shared/env-loader，继续从根 .env 读取，不创建新的配置加载器。
- 图片改为 new URL('../zao.png', import.meta.url)，修复从仓库根运行时找不到 ./zao.png 的问题；三处一行路径定位保留内联。
- 加入高价值复习注释，保留原有 chunked encoding、Object 路径、S3 通用客户端、文件流与 region 注释；补回原文 OSS region 提示。错误说法保留可识别原注释并紧邻更正。
- S3 移除 v2 风格 signatureVersion 配置；v3 不靠此字段切换签名。新增可选 S3_REGION，默认 us-east-1，取代原文 aaa 的随意值；这不是所有服务都接受该地域的保证。
- OSS/MinIO 的 catch 保留原日志，增加 process.exitCode=1，让捕获到的失败不被误判为成功退出；S3 继续抛出失败。
- package.json 移除不存在的 index.js main 和默认失败占位 test，新增语法 check 与三个 upload 命令，标记 private；未编造测试覆盖率。
- Compose 只增加部署/端口边界注释，保留原模板和注释，不改变镜像或启用状态。没有运行容器，也没有改真实 .env。
- 新增 README、REVIEW_NOTES 两份文档；不新增讲义、fallback、压缩包或独立 Git 仓库。

## 文章结论如何记才准确

| 原文观点 | 复习时的保留与校正 |
| --- | --- |
| 原文件进对象存储、元数据进关系库、切片进向量库 | 保留为常见架构分工；实际检索可直接用向量库返回文本，不一定每次下载原文件 |
| “向量库只存向量，关系库不能存二进制” | 过于绝对。向量库通常也能存文本/元数据，关系库能存二进制；对象存储常更适合大文件的容量、分发和生命周期管理 |
| “只有 MinIO 可以存这些素材” | MinIO 是实现之一；云 OSS、其他对象存储或其他文件系统也可满足不同场景 |
| 对象存储是扁平结构，/ 是虚拟目录 | 保留常见 Bucket/Key 模型。某些控制台创建目录会产生以 / 结尾的空对象，具体看服务行为 |
| 对象包含 Key、内容、元数据 | 保留；对象还可能有版本、校验和等属性。本课没演示自定义元数据写入，S3 ContentType 是内容类型属性 |
| “对象存储容量无限、五元够半年、零运维” | 不是保证。容量/单对象/请求存在限制，费用受容量、请求、流量等影响，托管仍需配置权限与生命周期 |
| OSS 公有云、MinIO/RustFS 私有化 | 保留部署维度，不能把三者当作市场全部方案。选择取决于需求、维护能力和版本 |
| “MinIO 大并发容易卡，RustFS 必然更快更省内存” | 当前课程没有基准测试，不能据语言或品牌下结论，应按硬件、负载、部署和产品成熟度评估 |
| MinIO AGPL、RustFS Apache-2.0 | 原文如此描述，应以选定版本 LICENSE 为准；AGPL 不等于禁止商用，Apache-2.0 也不是无任何义务 |
| RustFS 兼容 POSIX/WebDAV，某版本控制台功能变化 | 本课仅展示 S3 调用，没有验证其他协议或界面功能；需查实际版本支持矩阵，不作为已验证选型结论 |
| “所有 OSS 都能直接用 AWS SDK” | 需具体服务提供兼容 endpoint、API 与签名/寻址支持；阿里云 OSS 原生 SDK/API 不能只凭相似接口认定完全兼容 S3 |
| “本地服务 region 随便填” | region 参与签名，须按服务端要求设置；已补 S3_REGION 并保留原注释作对照 |

本课不包含上述性能、许可和版本能力的外部调研结论；这里说明的是文章断言的证据边界。

## 共享检查：课内与跨课

检查了 lessons 范围内环境加载器、OSS/MinIO/S3 客户端初始化、文件流路径、上传函数，以及 schema/examples/prompt/模型初始化。

- 根环境加载能力已有超过 3 个实际使用文件，例如 01 课的 tool-file-read.mjs、tool-file-write.mjs，和本课三个脚本，共至少 5 个。按规则复用 lessons/_shared/env-loader.mjs 及已有 package export；本课无 dotenv 初始化副本，无新增迁移。
- 三种 SDK 客户端初始化各自只有一个实现，参数和 API 不相同；跨课检索未发现这三个构造模式的其他 mjs 实现。本课学习目的就是比较 API，不抽象成统一上传器。
- 三处图片路径仅是一行 new URL，日志只是几行输出，不值得抽为 utils；putStream 的参数与 SDK 操作不同，不能只按函数名判断重复。
- 无模型、embeddings、schema、examples、prompt block 可抽离。没有创建课内空 _shared，已有共享能力继续留在 lessons/_shared。
- 编号脚本均有顶层上传逻辑，不互相 import；只复用共享模块与 npm SDK。

## 依赖、环境和降级复习

根 package.json、pnpm-lock.yaml 已承载 SDK，课内不安装 node_modules。本次不升级依赖。三个入口都无需模型 API，但实际运行都需外部对象存储与访问凭据；无需凭据/服务的执行仅限语法检查和 SDK 解析。

根 .env 变量完整列表与说明在 README：OSS 四项、MinIO 两项、S3 三项及可选 S3_REGION。共享加载器不覆盖已有 shell 环境变量。Compose 的 RUSTFS_ACCESS_KEY/RUSTFS_SECRET_KEY 与客户端 S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY 名称不同，需要人为对应；MinIO 服务端 ROOT_USER/ROOT_PASSWORD 与客户端 MINIO_ACCESS_KEY/MINIO_SECRET_KEY 同理。

MinIO 注释模板和 RustFS 活跃配置共享 9000/9001，不能默认同时启动。Docker、网络、桶、权限任一缺失时，按 README 路径读客户端构造和上传参数、运行 node --check，不模拟“上传成功”。没有新增 fallback 文件，PostgreSQL/向量库仍属文章架构背景。

## 交付自检

2026-09-10 完成以下检查：

- 三个入口逐一执行 node --check，全部通过；本课无 TypeScript 或构建任务，不冒充执行 tsc/build。
- ESLint recommended + Node globals 检查三个 mjs，0 条问题；源码及 package.json 的 Prettier 检查通过。
- 在课程目录导入 ali-oss、minio、@aws-sdk/client-s3 均成功；共享模块解析指向 lessons/_shared/env-loader.mjs。未导入会执行上传的编号脚本。
- 逐个核对图片 URL 均指向存在的 zao.png；没有读取或上传图片内容。
- 根依赖与锁文件中存在对应版本声明：ali-oss ^6.23.0、minio ^8.0.7、@aws-sdk/client-s3 ^3.1128.0、dotenv ^17.4.2。AWS SDK 当前根版本高于文章的 ^3.1076.0，本轮没有升级或降级。
- 实际按名称排序枚举确认脚本恰为 00、01、02，连续且等宽；原路径仅残留于映射，运行脚本与文档使用新路径。
- 编号入口没有互相 import，无新增空 _shared；课内根 Markdown 恰为 README.md、REVIEW_NOTES.md。
- 课程下无 node_modules、无嵌套 .git；归属 D:/1project/agent。本轮不提交、不推送，保留根依赖文件已有改动。
- package.json 运行入口、README 的环境变量/依赖分类/降级路径已补齐；无新 .env、fallback 或压缩包。
- 原源码注释保留；原文的错误或过度概括以相邻更正和本文差异表说明，没有静默删除。
- 未进行 HTTP 上传、桶创建、Docker 启停或镜像验证，未接触数据库、已有进程与端口。Compose 仅静态阅读，不能宣称部署验证通过。

实际交付文件按名称升序如下（配套资源免编号）：

```text
docker-compose.yml
package.json
README.md
REVIEW_NOTES.md
src/00-oss-upload.mjs
src/01-minio-upload.mjs
src/02-s3-upload.mjs
zao.png
```
