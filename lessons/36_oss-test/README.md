# 36 · Agent 对象存储：OSS、MinIO、RustFS/S3

> 验证边界：本课包含文章的 Docker Compose 模板，但不代表本机已有可用 Docker/对象存储服务。Docker 部署、Bucket 创建和上传均为外部前置条件 / TODO，本轮未执行。文章中的 PostgreSQL、向量库和 RAG 链路仅作架构说明，本课未实现或验证。

学习目标：理解 Bucket、Object Key、文件内容和元数据，按“托管 OSS → 自建 MinIO → S3 兼容 SDK”比较上传接口。无需模型 API，但实际上传都需要存储服务和访问凭据。

本课归属 `agent` Git 仓库，使用仓库根依赖与 `.env`；不是独立仓库，不在课程内安装依赖。

## 目录与学习顺序

```text
36_oss-test/
├── docker-compose.yml
├── package.json
├── README.md
├── REVIEW_NOTES.md
├── src/
│   ├── 00-oss-upload.mjs
│   ├── 01-minio-upload.mjs
│   └── 02-s3-upload.mjs
└── zao.png
```

三个主线脚本已实际连续编号；文档、包配置、部署模板与图片是配套资源，不编号。完整旧路径映射见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。

| 顺序/入口 | 对应文章与学习目的 | 存储目标 | 运行依赖及常见失败 |
| --- | --- | --- | --- |
| `src/00-oss-upload.mjs` | 阿里云 OSS 专用 SDK，putStream 上传 | OSS_BUCKET / test-agent/first.png | 阿里云 Bucket、OSS 凭据；缺密钥、region 错误或无写权限 |
| `src/01-minio-upload.mjs` | 自建 MinIO，putObject 显式分离桶和 Key | aaa / ccc/ddd/hello.png | localhost:9000 的服务、MinIO 凭据；连接失败或桶不存在 |
| `src/02-s3-upload.mjs` | RustFS/S3 兼容接口，Client + Command | hello / aaa/bbb/first.png | S3_ENDPOINT、S3 凭据；端点、签名地域、寻址方式或桶不匹配 |

三者均上传配套 `zao.png`，图片路径按源码位置解析，不依赖当前工作目录。固定 Key 重复上传可能覆盖同名对象（具体取决于服务端版本控制等设置）；脚本不会创建桶。

## 按依赖强度运行

### 1. 只做语法检查：无需密钥、无需服务

从仓库根运行：

```powershell
node --check lessons/36_oss-test/src/00-oss-upload.mjs
node --check lessons/36_oss-test/src/01-minio-upload.mjs
node --check lessons/36_oss-test/src/02-s3-upload.mjs
```

或在课程目录运行 `npm run check`。这些命令不执行顶层上传，不加载密钥，不连接服务器。不要用 import 上传脚本的方式做“检查”，因为三个入口都带有顶层执行逻辑。

### 2. 依赖解析：无需凭据，不上传

依赖已统一放在根 package.json / pnpm-lock.yaml：`ali-oss`、`minio`、`@aws-sdk/client-s3`、`dotenv`，以及已有 `@lessons/shared` 工作区包。需要安装时只在 **agent 根目录** 执行 `pnpm install`，不在本课运行 install，不建立课内 node_modules。

在课程目录确认解析路径：

```powershell
node -e "for (const p of ['ali-oss','minio','@aws-sdk/client-s3','@lessons/shared/env-loader']) console.log(p, require.resolve(p))"
```

本课 package.json 提供运行脚本，不重复声明依赖；单独复制本目录不足以运行，还需仓库根依赖与 lessons/_shared。

### 3. 模型 API

本课没有模型调用，无需 OpenAI 或其他模型 API Key。存储 Access Key 与模型 API Key 是两类配置。

### 4. 实际上传：需要外部服务与存储凭据

全部配置写在 **仓库根 `.env`**，由 `@lessons/shared/env-loader` 统一读取。不要新增课内 `.env`。共享加载器默认不覆盖 shell 已有同名环境变量，因此旧 shell 值也可能影响结果。

| 示例 | 根 .env 变量 | 说明 |
| --- | --- | --- |
| 00 OSS | OSS_REGION、OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET | 如地域 oss-cn-hangzhou；使用自己的已有桶和有写权限的凭据 |
| 01 MinIO | MINIO_ACCESS_KEY、MINIO_SECRET_KEY | 对应服务端账号；客户端固定 localhost:9000、useSSL=false、桶 aaa |
| 02 S3 | S3_ENDPOINT、S3_ACCESS_KEY_ID、S3_SECRET_ACCESS_KEY | endpoint 包含协议，如 http://localhost:9000；桶 hello |
| 02 S3 | S3_REGION（可选） | 默认 us-east-1；如服务端有地域要求，必须一致 |

不在文档记录真实密钥。三个脚本互不依赖，可分别配置；已有 OSS 变量不代表 MinIO/S3 变量也已配置。

用户完成服务准备、创建对应桶并确认目标后，在课程目录**手动选择**执行：

```powershell
npm run upload:oss
npm run upload:minio
npm run upload:s3
```

同样可以从仓库根执行 `node lessons/36_oss-test/src/00-oss-upload.mjs` 等编号入口。这里列出的是操作命令，不是本轮上传成功的记录。

### 5. Docker 部署模板：外部前置条件 / TODO

`docker-compose.yml` 当前启用 RustFS，MinIO 配置保留为注释供文章对照。API 为 9000、控制台为 9001，两种服务不能按原配置同时占用这些端口。固定示例账号仅用于教学；Compose 中服务端变量不会自动变成 Node 脚本的客户端变量，需要在根 .env 配置对应值。

- MinIO 模板固定镜像标签；RustFS 使用 latest，后续行为需按实际镜像版本核实。
- 主机挂载目录为 `volumes/minio-data`、`volumes/rustfs-data`、`volumes/rustfs-logs`；它们是未来服务数据，不是学习源码，不应提交。
- `version: "3.8"` 是原文配置，较新 Compose 可能提示该字段过时。
- 启动服务前由用户确认 Docker、目录权限、端口和镜像命令；本轮不拉镜像、不运行 Compose、不接管已存在服务。

## 服务不可用时怎么复习

依次读 00 的 Bucket/Key/stream，01 的 putObject 参数，再比较 02 的 PutObjectCommand；最后对照 Compose 中“服务端账号”与根 .env 的“客户端凭据”。执行语法检查和依赖解析即可完成代码层复习。网络请求是阻塞点，不用增加本地假上传或 fallback 文件。

## 常见问题与核心结论

- `require accessKeyId, accessKeySecret`：检查根 .env 对应 OSS 变量是否非空，以及 shell 是否存在旧同名值；不是缺 npm 依赖。
- `MODULE_NOT_FOUND`：检查根依赖是否安装，不能只改 package.json 而不完成安装。
- `ECONNREFUSED`：对应服务尚未准备好，或端点/端口不一致；不能据此自动启动 Docker。
- `NoSuchBucket`：先确认使用的是 OSS_BUCKET、aaa 还是 hello；Key 中的 aaa/bbb 不会帮你创建桶。
- 403 / 签名错误：检查凭据、授权、endpoint、region 和系统时间，不要把密钥打印到日志。
- 图片报 ENOENT：确认课程根的 zao.png 存在；整理后图片路径已不依赖命令目录。
- 对象存储通常以 Bucket + Key 标识对象；斜杠用于前缀分组，不能等同于真实文件夹。
- Agent 中可分别用对象存储保存原文件、关系库维护业务元数据、向量库做语义检索。这是常见分工，不是各系统绝对无法存储其他类型的数据。
- S3 兼容是减少 SDK 差异的手段，不代表所有 OSS 都支持全部 S3 API，也不保证性能、运维成本和授权条件相同。

下次复习先回答：桶与 Key 各是什么？流来自哪里？凭据来自哪里？请求发往哪个服务？再读 [文章结论校正与自检](./REVIEW_NOTES.md)。
