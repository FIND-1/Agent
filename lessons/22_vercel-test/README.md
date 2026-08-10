# Lesson 22：AGUI 流式文本与工具组件

## 学习目标

本课把传统“只返回文本”的 Agent，升级为前端能区分文本、工具参数和工具结果的交互界面。文章所称的 AGUI，在代码中使用 Vercel AI SDK 的 Data Stream Protocol 实现：LangChain 负责 Agent 与工具循环，AI SDK 负责前后端 UI 消息协议。

完整链路：

```text
React useChat
  -> POST /ai/chat（UIMessage[]）
  -> LangChain createAgent
  -> web_search / send_mail
  -> toUIMessageStream（Data Stream Protocol）
  -> message.parts
  -> Streamdown / 自定义 Tool Panel
```

## 推荐复习顺序

本课是两个子应用组成的单项目式课程，没有编号示例文件。按调用链阅读：

| 顺序 | 文件 | 学习目的 | 外部依赖 |
| --- | --- | --- | --- |
| 1 | `agui-backend/src/main.ts` | Nest 启动、CORS 与端口 | 无 |
| 2 | `agui-backend/src/app.module.ts` | 根 `.env`、Mailer 与 AI 模块装配 | 无 |
| 3 | `agui-backend/src/ai/ai.module.ts` | 模型、联网搜索和邮件 Tool Provider | 模型、Bocha、SMTP |
| 4 | `agui-backend/src/ai/ai.service.ts` | `createAgent` 与 AI SDK/LangChain 流适配 | 模型 API |
| 5 | `agui-backend/src/ai/ai.controller.ts` | `UIMessage[] -> Data Stream` 响应 | 模型 API |
| 6 | `agui-frontend/src/App.tsx` | `useChat` 与 `DefaultChatTransport` | 已启动的后端 |
| 7 | `agui-frontend/src/components/ToolPanels.tsx` | 工具状态判断和自定义组件 | 无，可静态复习 |
| 8 | `agui-frontend/src/components/StreamdownText.tsx` | 流式 Markdown、代码和 Mermaid | 无，可静态复习 |

## 环境配置

所有配置来自仓库根目录的 `.env`，不要在 lesson 内创建 `.env` 或 `.env.example`。

```dotenv
OPENAI_API_KEY=你的模型密钥
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus

BOCHA_API_KEY=你的 Bocha Web Search 密钥

# TODO：以下值由实际 SMTP 邮件服务商提供，文章没有给出可直接使用的账号。
MAIL_HOST=TODO_SMTP_HOST
MAIL_PORT=TODO_SMTP_PORT
MAIL_SECURE=false
MAIL_USER=TODO_SMTP_USER
MAIL_PASS=TODO_SMTP_PASSWORD_OR_AUTH_CODE
MAIL_FROM=TODO_SENDER_ADDRESS
```

前端默认请求 `http://localhost:3000`。部署或更换端口时，通过启动前设置 `VITE_API_BASE_URL` 指向后端地址。

## 安装与运行

依赖只在仓库根目录安装：

```powershell
# From the repository root:
pnpm install
```

### 1. 无需 API Key 的静态检查

```powershell
npm --prefix lessons/22_vercel-test run backend:build
npm --prefix lessons/22_vercel-test run backend:test
npm --prefix lessons/22_vercel-test run frontend:build
npm --prefix lessons/22_vercel-test run frontend:lint
```

这些命令不会主动调用模型、搜索或邮件服务。

### 2. 需要模型 API 的文本对话

分别打开两个 PowerShell：

```powershell
npm --prefix lessons/22_vercel-test run backend:start
```

```powershell
npm --prefix lessons/22_vercel-test run frontend:start
```

前端默认地址为 `http://localhost:5173`，后端默认地址为 `http://localhost:3000`。

### 3. 需要外部服务的工具调用

- `web_search`：额外需要 `BOCHA_API_KEY`。
- `send_mail`：额外需要完整 SMTP 配置；邮件会真实发送，请使用可控收件地址测试。
- 本课不依赖 Docker、数据库或 Milvus。

## fallback 复习路径

- 没有任何密钥：执行四项静态检查，按推荐顺序阅读 `toBaseMessages -> createAgent.stream -> toUIMessageStream -> useChat -> message.parts`。
- 只有模型密钥：可以验证流式文本；提示模型不要调用工具，即可避开 Bocha 和 SMTP。
- 没有 Bocha：工具会返回“API Key 未配置”，前端仍能复习工具结果组件。
- 没有 SMTP：不要真实触发 `send_mail`；静态阅读其 Zod schema、Provider 和前端发送状态组件。

## 常见报错

- `Cannot find package`：回仓库根目录执行 `pnpm install`，不要在子课程运行 `npm install`。
- 前端显示网络错误：确认后端已启动，并检查 `VITE_API_BASE_URL`。
- 模型返回 401/404：核对根 `.env` 的模型密钥、Base URL 和模型名。
- 搜索返回 Key 未配置：补充 `BOCHA_API_KEY`。
- 邮件认证失败：核对 SMTP host、port、secure、账号和授权码；这些值不能从文章自动补全。
- Vite 提示 chunk 超过 500 kB：Streamdown 的代码高亮和 Mermaid 会带来较大的按需 chunk，不影响本课功能验证。

## 关键结论

- Data Stream Protocol 用 `type/state` 区分文本、工具参数和工具结果，前端无需手写 SSE 解析器。
- LangChain 继续负责成熟的 Agent 能力，`@ai-sdk/langchain` 只承担协议适配。
- `isToolUIPart`、`getToolName` 和工具 `state` 决定前端渲染哪个组件。
- Streamdown 适合尚未完整输出的 Markdown；代码高亮和 Mermaid 的代价是更大的前端构建体积。
- 新增 Tool 时，后端需要注册 schema 与实现，前端需要按工具名补充输入、输出和状态组件。

文章与源码的完整对应关系及本轮自检见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。
