# REVIEW_NOTES

## 本次整理范围

本文件是 `hello-nest-langchain` 的长期复习入口，已经合并原 `LESSON.md` 的核心讲义内容。整理后的当前子课程只保留两份 Markdown：

```text
README.md
REVIEW_NOTES.md
```

本轮做了三件事：

- 将 `LESSON.md` 的讲义主线压缩进本文件。
- 让 `README.md` 只作为快速入口、运行方式和依赖分类。
- 删除独立 `LESSON.md`，避免同一 lesson 存在三份复习文档。

本轮不改 Nest 源码、不改接口行为、不处理 `dist/` 构建产物。

## 讲义摘要

本节把前面运行在 Node.js 脚本里的 LangChain Chain 放进 Nest 后端服务，对外提供普通问答接口和 SSE 流式问答接口。完整请求链路是：

```text
浏览器 EventSource
  -> Nest Controller
  -> AiService
  -> PromptTemplate | ChatModel | StringOutputParser
  -> 模型服务
  -> AsyncGenerator
  -> RxJS Observable
  -> text/event-stream
```

完成本节后，应该掌握：

- Nest 如何用 Module、Controller、Service 组织后端代码。
- Nest 依赖注入如何管理业务服务、仓库对象和模型实例。
- LangChain 的 `invoke()` 与 `stream()` 分别适合什么场景。
- 如何把 LangChain 的异步数据流转换成 Nest SSE 响应。
- 浏览器如何通过 `EventSource` 持续接收模型输出。

### Nest 三个核心角色

| 角色 | 职责 | 本项目示例 |
| --- | --- | --- |
| Module | 组织并声明一个功能域中的依赖 | `BookModule`、`AiModule` |
| Controller | 定义路由，接收和返回 HTTP 数据 | `BookController`、`AiController` |
| Service | 承载业务逻辑或调用外部服务 | `BookService`、`AiService` |

`AppModule` 是根模块。只有被它直接或间接导入的模块，其 Controller 路由才会生效。

### Book 模块和依赖注入

`BookModule` 用不依赖数据库的内存仓库演示 Nest Provider：

- `BookController` 声明 `/book` 路由。
- `BookService` 负责图书相关逻辑。
- `BOOK_REPOSITORY` 通过 `useFactory` 创建内存仓库。

Provider 不只可以是带 `@Injectable()` 的 class，也可以是工厂函数返回的普通对象。`BookService` 通过 `@Inject('BOOK_REPOSITORY')` 消费该对象。

依赖注入的价值不是少写 `new`，而是把对象创建、生命周期和替换权交给容器，业务代码只依赖能力，不负责组装能力。

### 模型 Provider

密钥、模型名和服务地址不应硬编码在 `AiService` 中。本项目通过 `ConfigModule` 读取工作区根目录 `.env`：

```env
OPENAI_API_KEY=你的密钥
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
```

`AiModule` 使用 `useFactory` 创建 `CHAT_MODEL` Provider，再注入 `AiService`。这样模型只在模块初始化时创建一次，后续请求复用同一个模型实例。

### LangChain Chain

`AiService` 在构造器中组装 Chain：

```ts
const prompt = PromptTemplate.fromTemplate('请回答以下问题：\n\n{query}');

this.chain = prompt.pipe(this.model).pipe(new StringOutputParser());
```

数据依次经过：

1. `PromptTemplate` 把 `{ query }` 渲染进提示词。
2. ChatModel 调用模型服务并得到消息输出。
3. `StringOutputParser` 把消息内容转换为字符串。

Chain 是可复用对象，所以在 Service 创建时组装一次即可。

### 普通问答接口

`GET /ai/chat?query=什么是LangChain` 调用 `chain.invoke()`，等待完整结果后返回：

```json
{
  "answer": "..."
}
```

这种方式实现简单，但模型生成期间客户端一直拿不到内容，长回答的等待感会比较明显。

### SSE 流式接口

`chain.stream()` 返回可异步遍历的流。`streamChain()` 用异步生成器逐块转发内容：

```ts
async *streamChain(query: string): AsyncGenerator<string> {
  const stream = await this.chain.stream({ query });

  for await (const chunk of stream) {
    yield chunk;
  }
}
```

Controller 使用 `@Sse('chat/stream')` 输出 `text/event-stream`，并将异步生成器转换为 RxJS `Observable<MessageEvent>`：

```ts
return concat(
  from(this.aiService.streamChain(query)).pipe(
    map((data): MessageEvent => ({ data })),
  ),
  of({ type: 'done', data: 'done' }),
);
```

`from()` 负责把异步生成器转换成 Observable，`map()` 负责把字符串转换成 Nest SSE 事件对象，`concat()` 在模型流结束后追加自定义 `done` 事件。

### 浏览器 EventSource

测试页 `public/sse-test.html` 使用浏览器原生 `EventSource`：

```js
const url = `/ai/chat/stream?query=${encodeURIComponent(question)}`;
const source = new EventSource(url);

source.onmessage = ({ data }) => {
  output.textContent += data;
};

source.addEventListener('done', () => {
  source.close();
});
```

注意点：

- `EventSource` 只能发起 GET，请求参数需要放在 URL 中并编码。
- 普通 SSE 消息进入 `onmessage`。
- `done` 是本项目约定的自定义事件，不是 SSE 协议自动提供的结束事件。
- 请求完成或异常后应主动 `close()`，避免无意义重连。

## 当前结构

```text
hello-nest-langchain/
  README.md
  REVIEW_NOTES.md
  package.json
  public/
    sse-test.html
  src/
    app.module.ts
    ai/
      ai.module.ts
      ai.service.ts
      ai.controller.ts
    book/
      book.module.ts
      book.service.ts
      book.controller.ts
```

`dist/` 是构建产物，不作为复习和维护的主要阅读对象。

## 推荐复习顺序

本 lesson 不是 `00-xxx.mjs`、`01-xxx.mjs` 这种编号示例文件结构，而是一个单独 Nest 子项目。复习时不要按文件名排序猜顺序，应按 Nest 模块依赖关系、HTTP 请求调用链和运行依赖逐层阅读。

推荐顺序如下：

1. `src/app.module.ts`：根模块，集中组装 `ConfigModule`、`ServeStaticModule`、`BookModule` 和 `AiModule`。
2. `src/book/book.module.ts`：用 `useFactory` 注册内存仓库 Provider，演示 token 注入。
3. `src/book/book.service.ts`：通过 `@Inject('BOOK_REPOSITORY')` 消费 Provider，展示属性注入。
4. `src/ai/ai.module.ts`：用 `useFactory` 创建 `CHAT_MODEL`，把模型实例创建从业务服务中拆出去。
5. `src/ai/ai.service.ts`：组装 `PromptTemplate -> ChatModel -> StringOutputParser`，同时提供 `invoke()` 和 `stream()`。
6. `src/ai/ai.controller.ts`：提供普通 JSON 问答接口和 SSE 流式接口。
7. `public/sse-test.html`：用浏览器原生 `EventSource` 验证流式输出。

## 环境约束

- 所有 lesson 共用工作区根目录 `D:\1project\agent\.env`。
- 不在 `hello-nest-langchain` 下新增 `.env` 或 `.env.example`。
- 从 `hello-nest-langchain` 目录启动时，`ConfigModule` 才能按当前相对路径读取到工作区根目录 `.env`。
- AI 接口需要 `OPENAI_API_KEY`，可选读取 `OPENAI_BASE_URL` 和 `MODEL_NAME`。
- SSE 测试页默认访问 `http://localhost:3000`，端口变化时需要在页面输入框里调整 API 地址。

## 依赖分类

- 无需 API Key：`GET /`、`GET /book`，以及阅读 `src/book/*`、`src/app.module.ts`。
- 需要模型 API：`GET /ai/chat?query=...`、`GET /ai/chat/stream?query=...`、`public/sse-test.html` 的真实流式请求。
- 需要外部服务：不需要 Milvus、Docker、数据库或向量库；只需要兼容 OpenAI 协议的模型服务。
- fallback 路径：没有 API Key 时，先复习 Book 模块和 AI 模块代码，再读 SSE 转换链路，不验证真实模型输出。

## _shared 抽离结果

本 lesson 没有在 `hello-nest-langchain/src/` 下新增 `_shared/`。

原因：

- 当前不是多个编号 `.mjs` 示例文件组成的脚本型 lesson，而是一个 Nest 子项目。
- 模型创建集中在 `src/ai/ai.module.ts` 的 `CHAT_MODEL` Provider 中，业务服务没有重复创建模型。
- 环境变量读取集中在 `ConfigModule` 和 `AiModule`，没有在多个示例文件中重复散落。
- prompt block 只在 `src/ai/ai.service.ts` 中出现一次。
- schema、examples、工具函数没有形成 2 次及以上重复。
- `src/ai/ai.module.ts` 已通过动态 import 复用仓库级 `lessons/_shared/model.mjs`，没有必要再创建 lesson 内空置 `_shared/`。

## import 检查

- 当前项目不是编号示例文件结构，没有 `00-xxx.mjs`、`01-xxx.mjs` 这类示例互相 import 的问题。
- `src/` 内未发现编号示例文件 import 另一个编号示例文件的结构。
- 可复用模型工厂来自仓库级 `lessons/_shared/model.mjs`，不是从某个编号示例文件复用。

## 后续注意

- 如果调整路由，必须同步 `README.md`、`REVIEW_NOTES.md` 和 `public/sse-test.html` 的接口说明。
- 如果调整模型创建方式，优先维护 `src/ai/ai.module.ts` 的 Provider 工厂，不要把配置读取散落回 `AiService`。
- 如果加入对话历史、鉴权、限流、取消请求或异常事件，应单独开小步整理，不要和本 lesson 的基础 SSE 骨架混在一次改动里。
- 不要把 `dist/` 当作源码维护；需要确认行为时看 `src/`。
- 测试或构建结论要单独记录实际执行命令，不要只因为文档齐全就写成已验证通过。

## 核心结论

1. Nest 用 Module 划分功能，用 Controller 管理 HTTP 边界，用 Service 承载业务逻辑。
2. Provider 是可被容器管理和注入的能力，既可以来自 class，也可以来自 `useFactory`。
3. 模型和 Chain 应当复用，不要在每次请求中重复创建。
4. `invoke()` 返回完整结果，`stream()` 返回逐块结果。
5. LangChain 的异步流经过 `AsyncGenerator -> Observable<MessageEvent>` 转换后，可以由 Nest 通过 SSE 推送给浏览器。
6. 前端使用 `EventSource` 接收 `message`，并通过自定义 `done` 事件明确结束连接。

## 本轮验证记录

本轮目标是合并 `LESSON.md` 到 `REVIEW_NOTES.md`，并让当前子课程只保留 `README.md` 和 `REVIEW_NOTES.md` 两份 Markdown。

已执行：

```powershell
Test-Path .\lessons\17_nest+langchain\hello-nest-langchain\REVIEW_NOTES.md
Test-Path .\lessons\17_nest+langchain\hello-nest-langchain\LESSON.md
Get-Content -Encoding utf8 .\lessons\17_nest+langchain\hello-nest-langchain\README.md
Get-Content -Encoding utf8 .\lessons\17_nest+langchain\hello-nest-langchain\REVIEW_NOTES.md
Get-Content -Encoding utf8 .\SUMMARY_RULES.md
git diff --check -- SUMMARY_RULES.md lessons/17_nest+langchain/hello-nest-langchain/README.md lessons/17_nest+langchain/hello-nest-langchain/REVIEW_NOTES.md lessons/17_nest+langchain/hello-nest-langchain/LESSON.md
```

已按 `SUMMARY_RULES.md` 的课程根目录 Markdown 规则重新扫描 `lessons/`，本轮只报告其他课程的不合规项，不自动合并或删除。

本轮不执行 `pnpm build`、`pnpm test` 或 `pnpm lint`：当前 `hello-nest-langchain` 目录未安装 `node_modules`，安装依赖需要额外网络步骤；同时本轮只改文档，不改运行时代码。

`SUMMARY_RULES.md` 中的 `node --check src/**/*.mjs` 不适用于本 lesson：当前是 Nest TypeScript 子项目，`src/` 下没有 `.mjs` 示例文件。

## 交付自检

- 目录结构：当前子课程最终只保留 `README.md` 和 `REVIEW_NOTES.md` 两份 Markdown。
- 单独 Nest 子项目复习顺序：已在“推荐复习顺序”中说明，本 lesson 没有编号示例文件，按模块依赖关系和请求调用链复习。
- `_shared/` 抽离：已检查重复项，当前不新增 lesson 内 `_shared/`，并说明原因。
- 编号示例 import：当前不是编号示例结构，未发现编号示例互相 import。
- README 依赖分类：已补充无需 API Key、需要模型 API、fallback 复习路径。
- package.json：子项目已有 `package.json`。
- 环境变量说明：README 和本文件均指向工作区根目录 `.env`。
- fallback：已补充无 API Key 时的最小复习路径。
- 运行检查：未执行依赖型命令；`node --check` 对当前无 `.mjs` 的 Nest TS 子项目不适用，不能写成已通过。
