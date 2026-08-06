# Lesson 22 复习与整理记录

## 文章主线

原文先指出普通 SSE 只有文字，前端无法知道当前 chunk 是回答内容还是 tool call。Vercel AI SDK 的 Data Stream Protocol 给消息增加类型与状态：文本经历 start/delta/end，工具经历 input streaming/input available/output available。前端据此把同一条流拆成 Markdown、搜索结果、邮件状态等不同组件。

文章采用职责分工：LangChain `createAgent` 负责模型和工具循环；`@ai-sdk/langchain` 把 LangChain 消息与流转换为 AI SDK UI 协议；React `useChat` 消费协议并得到 `messages[].parts`。

## 代码对应关系

### 后端

1. `src/main.ts`：启动 Nest，并允许 Vite 开发站点跨域请求。
2. `src/app.module.ts`：读取仓库根 `.env`，注册 SMTP transport 与 `AiModule`。
3. `src/ai/ai.module.ts`：注册共享 ChatModel、`web_search` 和 `send_mail` Provider。
4. `src/ai/ai.service.ts`：创建包含两个工具的 Agent，把 UIMessage 转成 LangChain 消息，再把 Agent stream 转回 UIMessage stream。
5. `src/ai/ai.controller.ts`：校验请求体并用 `pipeUIMessageStreamToResponse` 写入响应。

### 前端

1. `src/App.tsx`：通过 `DefaultChatTransport` 连接 `/ai/chat`，管理发送、停止、错误与流式状态。
2. `src/components/ToolPanels.tsx`：按 `isToolUIPart`、工具名和 state 渲染搜索、邮件、pending、error 或默认输出。
3. `src/components/StreamdownText.tsx`：渲染未闭合 Markdown、Shiki 代码高亮和 Mermaid。

## 本轮整理

- 在课程根新增 `README.md`、`REVIEW_NOTES.md` 和统一脚本入口 `package.json`。
- 将两个脚手架 README 改成子应用的精简说明，移除与课程无关的模板广告内容。
- 修复 Bocha 无效响应提示中的乱码。
- CORS 去掉与通配 origin 不匹配、且本课不需要的 credentials 配置。
- 前端后端地址支持 `VITE_API_BASE_URL`，本地仍默认 `http://localhost:3000`。
- 邮件 HTML 改为源码预览，不再通过 `dangerouslySetInnerHTML` 注入聊天页面。
- 为入口、模块、Controller、Service、协议渲染和 Markdown 渲染补充复习型注释。
- 清理前端独立 npm 安装产物，课程依赖由仓库根 pnpm workspace 统一维护。
- 将 Vite 与 TypeScript 增量缓存移到仓库根 `node_modules`，避免开发运行重新生成 lesson 内目录。

## 文章与当前代码差异

- 文章示例直接在 `AiModule` 创建 `ChatOpenAI`；当前项目复用 `@lessons/shared/model`，避免重复模型初始化。
- 文章只描述邮件环境配置的位置，没有给出 SMTP 实际值，因此保留为明确 `TODO`，不能伪造可运行配置。
- 文章的搜索工具返回格式化字符串；当前前端按该格式解析结果。若后续改为结构化 JSON，需要同步更新前端 parser。
- 当前依赖版本比文章撰写时更新，工具状态使用现有 AI SDK 的 `input-streaming`、`input-available`、`output-available` 和 `output-error`。

## `_shared/` 抽离判断

已检查模型初始化、环境变量读取、schema、examples、prompt block 和工具函数：

- 模型初始化只有一处，并已复用仓库级 `@lessons/shared/model`。
- 环境变量由 Nest `ConfigModule`/`ConfigService` 统一读取，没有跨文件重复加载。
- Web Search 与 Send Mail 的 schema 语义不同，不应合并。
- 前端解析函数只服务 `ToolPanels.tsx`，当前没有第二个调用方，抽离会降低单文件复习可读性。
- 本课没有编号示例文件，也不存在编号示例互相 import。

因此不新增空的 `_shared/`；共享模型继续使用仓库已有实现。

## 外部依赖与 fallback

- 无密钥：后端构建/单测与前端构建/lint 可运行，足够复习协议调用链。
- 仅模型密钥：可验证纯文本 Data Stream 和 Streamdown。
- Bocha 不可用：`web_search` 返回可读错误字符串，前端仍展示 tool output。
- SMTP 不可用：只做静态复习，不触发真实邮件。SMTP 参数列为 `TODO`。
- 本课没有本地数据库、Docker 或 Milvus 前置条件。

## 后续注意

- `TODO`：由使用者选择 SMTP 服务商并填写根 `.env` 的六个邮件变量。
- `TODO`：真实部署时为后端配置明确的 CORS origin，不继续使用开发期通配值。
- `TODO`：生产部署时设置 `VITE_API_BASE_URL`，并根据部署平台配置后端运行方式。
- 如果增加第三个工具，应同时补后端 Tool Provider、Agent tools 列表、前端输入/输出类型和自定义面板。

## 自检清单

- [x] 文章主线与前后端代码建立对应关系。
- [x] 单项目式课程按模块依赖与请求调用链给出复习顺序。
- [x] 核心源码文件已补复习型注释。
- [x] 课程根 Markdown 仅保留 `README.md` 与 `REVIEW_NOTES.md`。
- [x] 未创建空 `_shared/`，并说明不抽离原因。
- [x] 不存在编号示例文件及编号示例互相 import。
- [x] README 按静态检查、模型 API、外部工具和 fallback 分类。
- [x] README 说明所有环境变量来自仓库根 `.env`。
- [x] 文章无法提供的 SMTP 实际参数已标记 `TODO`。
- [x] 后端构建和单测、前端构建和 lint 已纳入验证命令。

## 实际验证结果

- 根目录 `pnpm install`：通过，`pnpm-lock.yaml` 已同步；前端依赖已提升到根 `package.json`。
- lesson 内 `node_modules`：0 个，独立 `package-lock.json` 已清理。
- `npm run backend:build`：通过。
- `npm run backend:test`：通过，1 个 suite、1 个 test。
- `npm run frontend:build`：通过；Vite 仅提示 Streamdown/Mermaid 相关 chunk 超过 500 kB。
- `npm run frontend:lint`：通过。
- HTTP 冒烟：`GET /` 返回 200；缺少 messages 的 `POST /ai/chat` 返回 400。
- 浏览器冒烟：页面非空，输入框和发送按钮可见，无 Vite error overlay，无控制台 warning/error。
- `node --check`：本课没有 `.mjs`/`.js` 教学入口，不适用；TypeScript 已由 Nest、`tsc -b` 和 ESLint 验证。
