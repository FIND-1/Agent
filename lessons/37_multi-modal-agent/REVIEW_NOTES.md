# 第 37 课复习记录

## 材料与整理边界

用户附件 `D:/360MoveData/Users/uu/Desktop/SUMMARY_RULES.txt` 的正文实际是《多模态与 OSS 前端直传实战：AI 画板》，不是整理规则。本文按仓库 `AGENTS.md` 和根 `SUMMARY_RULES.md` 整理；文章中的创建项目、安装和云端操作是学习材料，不作为自动执行授权。

本轮补充两份课程文档、替换嵌套应用脚手架说明、补充关键调用链注释和格式整理。静态检查中还移除了两个冗余类型断言、为 DTO 转换输入标注 unknown、显式标记启动 Promise，并去掉前端未使用的 diff 变量；均不改变请求转换或业务分支。现有编号、模型选型、共享入口、页面交互和服务端业务均保留。没有改动根 `.env`、没有新增依赖、没有启动服务或调用云端。本课程无需 SQL；持久化数据库仍是未接入项。

## 文章主线与代码映射

1. 文字 Agent 如何接收图片：视觉模型 + 带 URL 的多模态消息，对应 `01`。
2. “其余案例从仓库复制”：当前仓库补足音频、视频理解和万相生成，对应 `02–07`；附件没有逐项展示这些源码，不能声称所有模型参数都来自原文。
3. 文件在哪里：理解输入 URL、提供方临时结果 URL、自有 OSS 对象 URL 的区别。
4. 前端直传：服务端签发上传策略，浏览器直接向 OSS 提交 `FormData`，对应 `00` 与教学 HTML。
5. 综合实战：Nest 调用万相并将结果转存 OSS，前端通过 URL 引用媒体，见 `ai-canvas/`。

| 原文路径 / 未编号文件名 | 当前编号或应用路径 | 说明 |
| --- | --- | --- |
| `src/sts-gen.mjs` | `src/00-sts-gen.mjs` | 原文明示；保留 basename，实际为 Post Policy 签名 |
| `src/image-understanding.mjs` | `src/01-image-understanding.mjs` | 原文明示；模型初始化复用跨课工厂 |
| `src/audio-understanding.mjs` | `src/02-audio-understanding.mjs` | 当前源码名称对照，附件仅笼统提及其余案例 |
| `src/video-understanding.mjs` | `src/03-video-understanding.mjs` | 同上 |
| `src/text-to-image.mjs` | `src/04-text-to-image.mjs` | 同上 |
| `src/image-edit.mjs` | `src/05-image-edit.mjs` | 编辑能力也是画板主线，附件未逐字列此路径 |
| `src/text-to-video.mjs` | `src/06-text-to-video.mjs` | 当前源码名称对照 |
| `src/image-to-video.mjs` | `src/07-image-to-video.mjs` | 当前源码名称对照 |
| `public/index.html` | `public/index.html` | 保留原文占位页面用于对照，不冒充已接入 |
| `ai-canvas/` | `ai-canvas/` | 原文明示完整 Nest 应用，内部按框架命名 |

以上编号在本轮开始前已经存在；本轮没有重命名，也没有复制一套旧路径入口。原文从图像理解讲起，现有编号先放 OSS 前置知识，再递进到理解/生成；README 提供两种阅读路径。

按名称排序的核心目录（应用内部只展开阅读主线）：

```text
37_multi-modal-agent/
├── ai-canvas/                  # 完整应用，最后综合复习
│   ├── public/index.html
│   └── src/
│       ├── ai/
│       │   ├── ai.controller.ts
│       │   ├── ai.module.ts
│       │   ├── ai.service.ts
│       │   ├── dto/image.dto.ts
│       │   ├── image-record.interface.ts
│       │   ├── image-store.service.ts
│       │   └── oss.service.ts
│       ├── app.controller.ts
│       ├── app.module.ts
│       ├── app.service.ts
│       └── main.ts
├── output-wan-image-edit.png
├── output-wan-image-to-video.mp4
├── output-wan-text-to-image.png
├── package.json
├── public/index.html           # 原文占位演示
├── README.md
├── REVIEW_NOTES.md
└── src/
    ├── _shared/omni-model.mjs   # 公共配置，不编号
    ├── 00-sts-gen.mjs
    ├── 01-image-understanding.mjs
    ├── 02-audio-understanding.mjs
    ├── 03-video-understanding.mjs
    ├── 04-text-to-image.mjs
    ├── 05-image-edit.mjs
    ├── 06-text-to-video.mjs
    └── 07-image-to-video.mjs
```

媒体、静态页面、配置、测试、公共模块不是独立学习脚本，保持原名。Nest 内部推荐阅读顺序不按字母顺序，见下节。

## 画板调用链

先看 `main.ts` 的 ValidationPipe、`app.module.ts` 的根 `.env` 与静态资源目录，再看 `ai.module.ts` 的依赖注入。

| 入口 | 跟读位置 | 关键点 |
| --- | --- | --- |
| `GET /ai/oss/upload-signature?ext=.png` | controller → service → `OssService.createUploadPolicy` | 生成唯一 key，策略绑定 key 和过期时间，不返回 Secret |
| 浏览器上传 | `getOSSInfo → uploadToOSS → ensureUploaded` | 向 OSS host 发 POST，file 放最后；原文件不经过 Nest |
| `POST /ai/image` | DTO → `AiService.createImage` | 只有 prompt 则文生图；存在 imageUrl 则编辑图片 |
| 生成后的保存 | `uploadFromUrl → uploadBuffer → imageStore.add` | 下载临时结果，转存 OSS，最后创建内存记录 |
| `GET /ai/image/list` | `ImageStoreService.list` | 返回按时间降序的内存列表 |
| `DELETE /ai/image/:id` | `ImageStoreService.remove` | 只删记录，不删云端对象 |

最后阅读应用 HTML：选图后立即上传；如果已有 prompt，会接着自动生图。`uploadedImageUrl` 避免重复上传，`pendingFile` 保留待上传文件，`uploading/generating` 控制并发入口。原图本地预览使用 object URL，与给模型读取的 OSS URL 不同。

## 关键差异与边界

- **Post Policy ≠ STS**：文章把返回字段叫“sts 信息”，但代码只调用 `calculatePostSignature`，没有 AssumeRole，也没有临时 `SecurityToken`。保留 `sts-gen` 名字用于原文对照，在注释中更正概念。
- `00` 的一天有效期、约 1000 MiB 上传上限和 HTTP host 是原始教学配置；应用使用 HTTPS、1 小时签名、精确 key 条件。没有因整理任务擅自统一两者业务策略。
- 教学 HTML 的 `await '请求应用服务器拿到临时凭证'` 不是请求；空凭证无法上传。应用已有真实签名接口，但若接回教学页，还要把 `file.name` 改为服务端下发的 `key`，否则不满足 key 条件。
- `01` 使用 `OPENAI_*`；`02/03` 显式选择 `EMBEDDINGS_*` 作为 DashScope 兼容配置；`04–07` 与画板使用 DashScope 原生 SDK。变量名不是 API 协议，两个 base URL 不能互换。
- `04/05` 调用公开 `MultiModalConversation.call`；当前画板的 `wanCall` 通过类型断言调用 SDK 私有 `syncRequest` 并手工组装 `input/parameters`。这是已有实现，依赖 SDK 1.26.0 内部结构，升级需重新检查，类型断言不会验证运行时兼容性。本轮未改写此链路。
- `06/07` 的 `VideoSynthesis.call` 内部等待异步任务；不要把长时间等待误当成本地同步生成。结果下载目前直接写入固定文件且未检查 HTTP 状态，失败时可能保存错误响应，语法检查无法证明文件有效。
- OSS 对象存在不等于普通 URL 可读。当前输入图支持短时读取签名，但列表/生成结果返回普通 URL，私有 Bucket 的前端预览可能 403；`resolveReadableUrl` 的 host 判断还是字符串包含判断，不是严格 URL 主机校验。
- 页面限制 10 MiB，服务端策略允许 1000 MiB；`accept` 还包括 WebP，但提示文案只写 JPG/PNG。都是现有演示边界，不应当作完整服务端文件验证。
- 列表记录无持久化、无用户隔离，重启丢失；生成成功但转存失败时不会入列表，重试可能再次触发生成。没有把教学应用包装成生产级系统。
- 现有 E2E 测试仍期望根路径返回 `Hello World!`，而根路径已由画板静态页面承担，该断言过时。本轮不运行会初始化真实应用/依赖服务的 E2E，也不把控制器存在性单测当成业务验证。

## 共享代码检查

检查范围包含本课、相邻第 36 课 OSS 示例，以及 `lessons/` 内的模型与环境加载引用。

| 能力 | 使用文件与位置判断 | 本轮处理 |
| --- | --- | --- |
| 环境加载、Chat 模型、文本块提取 | 第 12–16、23、30、31、34 等课已使用，超过 3 文件 | 继续复用 `lessons/_shared/env-loader.mjs`、`model.mjs`，不新建副本 |
| DashScope 原生配置 | 本课 `04/05/06/07` 共 4 文件，已触发跨课共享位置规则 | 现有 `lessons/_shared/dashscope-client.mjs` 和包导出已满足；本轮不重复抽离 |
| Omni 配置 | `02/03` 两文件复用 | 保留 `src/_shared/omni-model.mjs`，内部仍用跨课 Chat 工厂 |
| OSS 初始化 | 第 36 课 `00-oss-upload.mjs`、本课 `00-sts-gen.mjs`、画板 `oss.service.ts`，共 3 文件 | 未超过阈值；V4 上传、Post 签名、Nest 生命周期各有教学作用，保留可对照实现 |
| Nest 模型配置 | 画板经 ConfigService 构造 SDK 客户端 | 保留为 Nest 依赖注入适配，不引入 ESM 共享配置与 CommonJS 应用互操作；调用参数仍在业务 service 内可读 |
| prompt/schema/examples/日志/下载 | 提示词、消息块和参数分别演示不同模态；下载展示结果 URL 到文件的转换 | 不抽成通用管道或日志包装。未新增空 `_shared`，编号示例不充当公共模块 |

原有共享文件和根依赖在本轮前已有未提交改动，本轮保持它们原样；以上描述是检查/复用结果，不是本轮新建成果。

## 复习自测

1. 为什么换了模型名还可能走错服务商？找到 `createChatModel` 的默认 Key/baseURL。
2. `input_audio` 与 `{ image }` 为什么不能随便交换？对照兼容接口与原生 SDK。
3. 前端直传节省了哪段流量？为什么生成结果还是由服务端下载转存？
4. POST 签名限制哪些条件？为什么上传 key 必须与服务器签发的一致？
5. 图片 URL 可以访问，是否意味着记录能跨重启保存？删除列表会删除对象吗？

没有 Key/OSS 时，阅读 README 的最小降级路径并查看既有媒体即可；没有新增非原文 fallback 或模拟运行结果。

## 本轮自检

2026-09-10 本地检查结果：

| 检查 | 结果 |
| --- | --- |
| 按名称升序实际列出 `src` | 00–07 连续、等宽、无重复；已有编号保留 |
| MJS 语法 | 逐个 `node --check` 检查 8 个示例和 1 个 Omni 共享模块，全部通过 |
| HTML 内联 JavaScript | 两个页面经 `vm.Script` 只解析不执行，通过；不是浏览器交互验证 |
| TypeScript | 根 TypeScript CLI，`--noEmit --incremental false`，最终通过 |
| ESLint | 现有配置覆盖应用 `src/**/*.ts`、`test/**/*.ts`，最终 0 错误/0 警告 |
| 现有 Jest 单测 | 1 个 suite、1 个控制器存在性用例通过；不覆盖生成或 OSS 业务 |
| 编号引用与旧路径 | 无编号示例互相 import；旧未编号路径只保留在本文映射表 |
| Markdown 与本地链接 | 课程根仅 README/REVIEW_NOTES，两级 README 链接存在；应用 README 属嵌套应用例外 |
| 依赖与共享目录 | 无子目录 node_modules；未安装依赖或修改根锁；Omni 共享目录非空，跨课入口沿用已有导出 |
| 依赖分类、环境、降级 | README 已按无 Key/模型 API/OSS 服务分类，说明仓库根 `.env` 和无服务阅读路径；未新增 fallback |
| 原注释与格式 | 原有有效注释保留，追加概念/边界说明；格式统一，未发现富文本缺空格模式 |

验证工具限制：pnpm 最初因沙箱无法读取用户配置报 EPERM；获得执行权限重试后脚本仍返回非零且无具体诊断，因此**不记录 pnpm check 成功**，以直接逐文件调用 Node 的成功结果为准。ESLint 首次发生内存分配失败；用 `--max-old-space-size=1024` 重试后完成检查，修复发现的类型标注问题并再次通过。

未执行：Nest 服务启动、构建产物运行、E2E、浏览器联调、模型调用、OSS 上传及真实云端读取。最终验证使用类型检查而非启动/构建预览，不宣称完整链路已跑通。原媒体文件保持不变，没有生成压缩包。
