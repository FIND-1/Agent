# Nest + LangChain：同步与 SSE 流式接口

本章在 Nest 中实现了模块化的图书 CRUD 示例、LangChain 同步问答接口和 SSE 流式问答接口。

## 配置

所有 lessons 子目录统一复用工作区根目录 `D:\1project\agent\.env`，与 `lessons\16_LCEL-chain` 使用同一套模型配置。不要在本子项目创建 `.env` 或 `.env.example`。根目录需要配置：

- `OPENAI_API_KEY`：模型服务密钥。
- `OPENAI_BASE_URL`：兼容 OpenAI 的服务地址；模板默认 DashScope 兼容模式。
- `MODEL_NAME`：模型名；模板默认 `qwen-plus`。

## 运行与验证

```powershell
pnpm start:dev
```

- `GET /book`：返回内存 mock 图书数据，展示 `useFactory` Provider 的注入。
- `GET /ai/chat?query=你好`：等待完整模型回答后返回 JSON。
- `GET /ai/chat/stream?query=你好`：以 `text/event-stream` 逐段返回模型输出。
- `/sse-test.html`：同源 SSE 浏览器测试页。

没有配置 `OPENAI_API_KEY` 时，`/ai/chat` 会返回清晰的 503 提示，而不会尝试使用占位密钥。
