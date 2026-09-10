# 第 37 课：多模态与 OSS 前端直传

结合《多模态与 OSS 前端直传实战：AI 画板》复习三件事：如何传入图片/音频/视频、如何生成媒体文件、如何用 OSS 直传和服务端转存组成 AI 画板。

**验证边界：本轮只进行本地静态检查和现有单元测试，不启动服务、不调用模型、不上传 OSS。** 当前课程不依赖 SQL 数据库；画板记录存在内存，重启会丢失。已有 `output-*` 文件保留为历史产物，不能作为本轮云端调用成功的证据。

## 学习顺序

原文顺序是“图像理解 → 其他多模态案例 → OSS 直传 → AI 画板”。当前代码已经按“先准备存储，再理解与生成，最后综合应用”编号，保留连续的 `00–07`，避免重复改名。首次按文章阅读可先看 `01`，系统复习按下表。

| 文件 | 学习目的 | 运行命令（课程目录） | 依赖 |
| --- | --- | --- | --- |
| `src/00-sts-gen.mjs` | 生成 Post Policy，观察签名与上传域名；不是 STS AssumeRole | `pnpm run oss:signature` | OSS Key、Bucket、查询地域权限 |
| `src/01-image-understanding.mjs` | `HumanMessage` 中组合 `text` 与 `image_url` | `pnpm run understand:image` | OpenAI 兼容视觉模型 API、可访问图片 |
| `src/02-audio-understanding.mjs` | `input_audio` 输入，Omni 流式输出文本 | `pnpm run understand:audio` | DashScope 兼容 API、可访问音频 |
| `src/03-video-understanding.mjs` | `video_url` 输入，复用 Omni 流式调用 | `pnpm run understand:video` | DashScope 兼容 API、可访问视频 |
| `src/04-text-to-image.mjs` | 原生 SDK 文生图，读取临时 URL 并下载文件 | `pnpm run wan:text-to-image` | DashScope 原生 API、下载网络 |
| `src/05-image-edit.mjs` | 同条消息传入编辑指令与原图 | `pnpm run wan:image-edit` | DashScope 原生 API、可访问原图 |
| `src/06-text-to-video.mjs` | 文生视频异步任务，SDK 轮询并下载 | `pnpm run wan:text-to-video` | DashScope 原生 API、下载网络 |
| `src/07-image-to-video.mjs` | 首帧图片生成视频，对比 `resolution` 与 `size` | `pnpm run wan:image-to-video` | DashScope 原生 API、可访问原图 |
| `public/index.html` | 对照文章的表单直传结构 | 仅静态阅读 | 签名请求仍为占位，不能直接完成上传 |
| `ai-canvas/` | 直传原图、生成/编辑、转存结果、管理列表 | 见下文及应用 README | 模型 API + OSS + Nest 服务 |

`ai-canvas/` 是完整 Nest 应用，保留框架命名，不编号；`public/`、历史媒体文件、配置和共享模块是配套资源，也不编号。原文路径映射、内部阅读顺序见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。

## 环境与依赖

使用仓库根的 Node.js >= 22、pnpm 和 `node_modules`。课程与嵌套应用不单独安装依赖。需要安装时，仅在仓库根执行：

```bash
pnpm --filter agent-engineering-lab install --frozen-lockfile
```

依赖已由根 `package.json` / `pnpm-lock.yaml` 管理：LangChain、`dashscope-sdk-official`、`ali-oss`、Nest、Config、ServeStatic、校验库和 TypeScript/Jest 工具。共享包 `@lessons/shared` 提供模型、环境加载和 DashScope 配置。

所有配置来自**仓库根 `.env`**，不需要课程专属 `.env`。不要把真实密钥放进 HTML。

| 变量 | 使用位置与含义 |
| --- | --- |
| `OPENAI_API_KEY`、`OPENAI_BASE_URL` | `01` 的聊天模型；地址和 Key 必须支持 `qwen-vl-plus`。模型名不会自动切换服务商 |
| `EMBEDDINGS_API_KEY`、`EMBEDDINGS_BASE_URL` | `02/03` 的 DashScope OpenAI 兼容接口。这里沿用现有变量名，实际调用 Chat 模型，并非生成向量 |
| `EMBEDDINGS_API_KEY` | `04–07` 与画板复用的 DashScope Key |
| `DASHSCOPE_HTTP_BASE_URL` | 可选，原生 SDK 地址，默认 `https://dashscope.aliyuncs.com/api/v1`；不能填兼容接口 `/compatible-mode/v1` 地址 |
| `OSS_REGION`、`OSS_BUCKET` | OSS 地域与 Bucket，地域格式如 `oss-cn-beijing` |
| `OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` | 服务端 OSS 访问密钥，与 Bucket 权限匹配 |
| `OSS_UPLOAD_PREFIX` | 画板直传目录，默认 `ai-canvas/uploads` |
| `OSS_PREFIX` | 画板生成结果目录，默认 `ai-canvas/edited` |
| `PORT` | 画板端口，默认 3000；启动前由用户确认端口可用 |

## 按依赖强度运行

### 1. 无密钥静态检查

从仓库根执行，不启动端口、不读取真实密钥进行云端验证：

```bash
pnpm --dir lessons/37_multi-modal-agent run check
node node_modules/typescript/bin/tsc -p lessons/37_multi-modal-agent/ai-canvas/tsconfig.json --noEmit --incremental false
```

### 2. 无需 API Key 的复习

没有完整的离线业务示例。可以阅读两个 HTML 的消息/表单构造、DTO 和内存列表实现，查看已有媒体文件；语法检查不代表外部 API 已通过。现有控制器单元测试可离线运行：

```bash
pnpm --dir lessons/37_multi-modal-agent/ai-canvas run test -- --runInBand
```

### 3. 需要模型 API

在课程目录按学习表执行 `01–07` 的脚本。`04–07` 会下载到**当前工作目录**下固定的 `output-wan-*.png/mp4`，再次执行会覆盖同名文件。它们不会上传到自己的 OSS；转存由画板实现。模型能力、地域、额度和参数限制以实际服务响应为准。

### 4. 需要 OSS / 本地服务

`00` 计算签名后会请求 Bucket 地域，不是完全离线操作。输出含可用于上传的签名，应只用于本地学习。其有效期为一天，画板签名为一小时并绑定服务器生成的唯一 `key`。

画板阅读顺序：`main.ts → app.module.ts → ai.module.ts → ai.controller.ts → dto/image.dto.ts → ai.service.ts → oss.service.ts → image-store.service.ts → public/index.html`。启动与构建命令见 [应用说明](./ai-canvas/README.md)，本轮未启动。

Bucket CORS 需要允许实际页面来源、`POST` 和所需请求头（学习配置可为 `*`）。Nest CORS 不能替代 Bucket CORS。上传成功不等于图片可被读取：当前返回的普通对象 URL 需要可读权限；私有 Bucket 的输入图会在服务端转为临时读取签名，但结果预览/列表没有统一签名刷新机制。

### 5. 外部服务不可用时

按 `01` 消息结构 → `02/03` 流式块 → `04/05` 返回 URL → `00` 签名条件 → 画板 `uploadToOSS → generateImage → createImage → uploadFromUrl → imageStore.add` 阅读。用已有媒体文件帮助理解输出形态，在实际请求处停止；不把占位页面当作 fallback，不新增模拟示例。

## 常见问题与复习结论

- `401/403`：检查使用的是哪组 Key、对应地址/地域、模型与 OSS 权限，不能只改模型名。
- `400` 或“不支持 audio/video”：检查模型能力及内容块协议；画板 Network 的 `/ai/image` Response 可区分 DTO 校验错误与 DashScope 错误。
- 原生 SDK、OpenAI 兼容接口的消息格式不同：前者 `{ text } / { image }`，后者使用 `type` 内容块。
- OSS `InvalidAccessKeyId`、`SignatureDoesNotMatch`、`NoSuchBucket`：分别核查有效 Key、签名/Secret/请求参数、Bucket 与地域；不是所有签名错误都只由 Secret 导致。
- 浏览器显示 `200` 但 `fetch` 报错：可能是 CORS 阻止读取响应，不能直接判定上传成功，也不要用 `no-cors` 掩盖错误。
- 模型结果 URL 可能过期。原文说“大概 24 小时”，应理解为临时资源，具体时效以提供方为准；需要保存文件或转存自己的 OSS。
- “存储对象”“浏览器能访问 URL”“列表记录持久化”是三件事。当前删除仅移除内存记录，不删除 OSS 文件。
- 本课是多模态调用与上传链路示例，没有 Agent 工具规划循环；不要把媒体输入输出本身理解为完整 Agent runtime。

完整差异、共享抽离检查与本轮验证结果见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。
