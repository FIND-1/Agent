# hello-nest-langchain

一个用于学习 Nest + LangChain 的最小示例，包含：

阶段提示：当前 `18_nest+langchain` 是 Nest 学习线的第二个学习阶段，用来把前面 LangChain/LCEL 能力放进 Nest 后端服务中；后续课程会在这个基础上继续扩展 tool、数据库和定时任务。

- Nest Module、Controller、Service 与依赖注入。
- 基于 `useFactory` 的内存仓库和 ChatModel Provider。
- LangChain 普通问答接口。
- 基于 SSE 的流式问答接口。
- 使用浏览器原生 `EventSource` 的测试页。

完整原理、代码导读和整理自检见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。

## 学习路径

建议按下面顺序复习：

1. `src/app.module.ts`：理解根模块如何组装配置、静态资源和业务模块。
2. `src/book/book.module.ts`：理解 `useFactory` Provider 和 token 注入。
3. `src/book/book.service.ts`：理解属性注入和内存 mock 仓库。
4. `src/ai/ai.module.ts`：理解模型 Provider 为什么放在模块工厂里创建。
5. `src/ai/ai.service.ts`：理解 `PromptTemplate -> ChatModel -> StringOutputParser` 的 Chain。
6. `src/ai/ai.controller.ts`：理解普通 JSON 接口和 SSE 接口的边界。
7. `public/sse-test.html`：理解浏览器如何用 `EventSource` 消费 SSE。

## 环境配置

项目读取工作区根目录的 `.env`：

```env
OPENAI_API_KEY=你的密钥
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
```

不要在本子项目下新增 `.env` 或 `.env.example`。所有 lesson 共用工作区根目录 `.env`。

## 运行方式

### 无需 API Key

`/book` 和 `/` 可以先用于确认 Nest 服务本身能启动：

```powershell
pnpm install
pnpm start:dev
```

默认监听 `http://localhost:3000`。

可访问：

- `GET /`
- `GET /book`

### 需要模型 API

下面接口需要根目录 `.env` 中存在有效的 `OPENAI_API_KEY`：

- `GET /ai/chat?query=你好`
- `GET /ai/chat/stream?query=你好`
- `GET /sse-test.html`

### fallback 复习路径

如果暂时没有模型 API Key，先按下面路径复习，不需要发起模型请求：

1. 先读 `src/book/*`，掌握 Nest Module、Controller、Service 和 Provider。
2. 再读 `src/ai/ai.module.ts`，理解模型实例如何通过 Provider 注入。
3. 最后读 `src/ai/ai.controller.ts` 和 `public/sse-test.html`，理解 `AsyncGenerator -> Observable<MessageEvent> -> EventSource` 的流式链路。

这条路径不能验证真实模型输出，但保留了本节的核心结构。

## 接口

| 地址 | 说明 |
| --- | --- |
| `GET /book` | 返回内存 mock 图书列表 |
| `GET /ai/chat?query=你好` | 返回完整 AI 回答 |
| `GET /ai/chat/stream?query=你好` | 通过 SSE 流式返回 AI 回答 |
| `GET /sse-test.html` | 打开 SSE 浏览器测试页 |

## 检查命令

```powershell
pnpm build
pnpm test
pnpm lint
```

如果本地还没有安装依赖，需要先在 `hello-nest-langchain` 目录执行 `pnpm install`。AI 相关接口缺少 `OPENAI_API_KEY` 时会返回 503；`query` 为空时会返回 400。
