# 第一阶段学习地图

第一阶段的主线不是“记住 LangChain 有多少 API”，而是理解一个 AI Agent 应用如何从最小模型调用扩展成可维护的工程链路：

```text
多模型差异
  -> ChatModel 统一调用
  -> PromptTemplate 控制输入
  -> OutputParser / withStructuredOutput 控制输出
  -> tool_call 让模型调用工具
  -> memory 管理上下文
  -> RAG 检索外部知识
  -> Runnable / LCEL 把组件编排成 chain
```

## 为什么需要 LangChain

docx 的起点是不同模型 API 格式差异：OpenAI 把 system 放进 `messages`，Anthropic 有独立 `system` 字段，Gemini 使用 `system_instruction` 和 `parts`。如果业务代码直接耦合这些格式，切换模型时会到处改。

LangChain 的第一层价值是让代码面向 `BaseChatModel` / `ChatModel`，具体模型由 `ChatOpenAI`、`ChatAnthropic`、`ChatGoogleGenerativeAI`、`ChatDeepSeek` 等类适配。

对应 lesson：

- `01_tool-test/src/hello-langchain.mjs`：早期模型调用入口。
- `lessons/_shared/model.mjs`：当前项目级 `createChatModel()` / `createEmbeddings()` 共享入口。

## ChatModel 如何屏蔽不同模型 API 差异

`BaseChatModel` 规定统一调用形态，业务侧主要使用：

- `invoke()`：一次性调用。
- `stream()`：流式调用。
- `bindTools()`：绑定工具，让模型返回 `tool_calls`。
- `withStructuredOutput()`：让模型按 schema 输出结构化对象。

模型差异留给具体实现类处理。OpenAI 兼容接口可以用 `ChatOpenAI`，但如果想使用某厂商独有特性，仍应优先考虑专用 ChatModel。

## PromptTemplate 如何管理输入

Prompt 部分的学习路径在 `14_prompt-template-test` 最完整：

1. `PromptTemplate`：字符串变量填充。
2. `ChatPromptTemplate`：生成 `system` / `human` / `ai` messages。
3. `MessagesPlaceholder`：把历史对话插入 prompt。
4. `PipelinePromptTemplate`：把人设、背景、任务、格式等模块组合。
5. `FewShotPromptTemplate`：加入少量示例稳定输出风格。
6. `LengthBasedExampleSelector` / `SemanticSimilarityExampleSelector`：按长度或语义选择示例。

Prompt 的核心不是“写得更长”，而是让长期迭代的输入规则可组合、可替换、可复习。

## OutputParser / withStructuredOutput 如何控制输出

输出控制分两条线：

- 模型原生结构化能力：`tool_call` 或 JSON schema。
- Prompt 约束 + 解析器：`StructuredOutputParser`、`JsonOutputParser`、`XMLOutputParser`、`JsonOutputToolsParser`。

docx 结论是：普通结构化 JSON 场景优先 `model.withStructuredOutput(schema)`；如果模型或接口不支持，再 fallback 到 parser。流式工具参数、非 JSON 格式、逐步展示解析状态时，OutputParser 仍有价值。

对应 lesson：

- `12_output-parser-test/src/05-with-structured-output-or-fallback.mjs`
- `12_output-parser-test/src/09-stream-tool-calls-raw.mjs`
- `12_output-parser-test/src/10-stream-tool-calls-parser.mjs`
- `13_mini_cursor/src/test/04-stream-mini-cursor.mjs`

## tool_call 如何让模型调用工具

tool 的固定结构是：

```text
name + description + schema + handler
```

调用过程是：

```text
messages -> model.bindTools(tools).invoke(messages)
  -> AIMessage.tool_calls
  -> 本地执行对应 tool
  -> ToolMessage 写回 messages
  -> 继续 invoke
  -> 直到没有 tool_calls
```

MCP 只改变工具来源：工具可以来自本地函数，也可以来自 MCP Server；绑定到模型后，对模型来说仍是工具。

对应 lesson：

- `01_tool-test/src/tool-file-read.mjs`
- `01_tool-test/src/all-tools.mjs`
- `01_tool-test/src/mcp/langchain-mcp-test.mjs`
- `16_LCEL-chain/src/01-case/00-mcp-test.mjs`

## memory 如何管理上下文

memory 解决的是对话变长后的上下文管理问题。docx 中提到三种策略：

| 策略 | 解决问题 | 对应代码 |
| --- | --- | --- |
| 截断 | 控制消息数量或 token 数 | `11_memory-test/src/memory/truncation-memory.mjs` |
| 总结 | 用模型把旧消息压缩成摘要 | `11_memory-test/src/memory/summarization-memory.mjs` / `summarization-memory2.mjs` |
| 检索 | 用向量数据库召回相关历史 | `11_memory-test/src/memory/retrieval-memory.mjs` |

短期对话可以用 `InMemoryChatMessageHistory`，长期记忆通常需要向量数据库或持久化后端。

## RAG 如何做知识检索

RAG 的学习主线是：

```text
Loader 加载来源
  -> Splitter 切分
  -> Embeddings 向量化
  -> VectorStore / Milvus 存储
  -> Retriever / similaritySearch 检索
  -> context 注入 prompt
  -> ChatModel 生成回答
```

对应 lesson：

- `06_rag-test/src/hello-rag.mjs`：内存向量库 RAG。
- `06_rag-test/src/loader-and-spiltter.mjs`：loader + splitter。
- `09_milvus-test/src/query.mjs`：Milvus similarity search。
- `09_milvus-test/src/ebook-reader-rag.mjs`：电子书阅读助手。
- `16_LCEL-chain/src/01-case/01-ebook-reader-rag.mjs`：LCEL 化的 RAG。

## Runnable / LCEL 如何把组件编排成 chain

学完组件后，问题变成如何组织组件。Runnable / LCEL 统一了组件接口：

- `PromptTemplate` 是 Runnable。
- `ChatModel` 是 Runnable。
- `OutputParser` 是 Runnable。
- 普通函数可以用 `RunnableLambda` 包装。
- 对象映射可以变成 `RunnableMap`。
- 顺序流程可以用 `pipe()` / `RunnableSequence`。

统一调用入口：

- `invoke`：单次输入。
- `stream`：流式输出。
- `batch`：批量输入。

工程增强：

- `withRetry`
- `withFallbacks`
- `withConfig`
- `callbacks`

对应 lesson：

- `15_runnable-test`：Runnable 基础 API。
- `16_LCEL-chain`：把 MCP、RAG、callbacks 等组合成 chain。

## 各 lesson 与知识点映射表

| 知识点 | lesson | 关键文件 |
| --- | --- | --- |
| ChatModel 统一调用 | `01_tool-test` / `_shared` | `src/hello-langchain.mjs`、`lessons/_shared/model.mjs` |
| tool / bindTools | `01_tool-test` | `src/tool-file-read.mjs`、`src/all-tools.mjs` |
| MCP 工具复用 | `01_tool-test` / `16_LCEL-chain` | `src/mcp/langchain-mcp-test.mjs`、`01-case/00-mcp-test.mjs` |
| PromptTemplate | `14_prompt-template-test` | `00-basic-prompt-template.mjs` |
| ChatPromptTemplate | `14_prompt-template-test` | `04-chat-prompt-template.mjs` |
| MessagesPlaceholder | `14_prompt-template-test` / `15_runnable-test` / `16_LCEL-chain` | `07-messages-placeholder-history.mjs`、`09-runnable-with-message-history.mjs` |
| PipelinePromptTemplate | `14_prompt-template-test` | `01-pipeline-prompt-modules.mjs`、`06-pipeline-chat-prompt-template.mjs` |
| FewShot / ExampleSelector | `14_prompt-template-test` | `08` 到 `13` |
| OutputParser | `12_output-parser-test` | `01` 到 `11` |
| withStructuredOutput | `12_output-parser-test` / `13_mini_cursor` | `05-with-structured-output-or-fallback.mjs` |
| tool_call_chunks | `12_output-parser-test` / `13_mini_cursor` | `09-stream-tool-calls-raw.mjs`、`10-stream-tool-calls-parser.mjs` |
| Memory | `11_memory-test` | `history-test.mjs`、`memory/*` |
| RAG | `06_rag-test` / `16_LCEL-chain` | `hello-rag.mjs`、`loader-and-spiltter.mjs`、`01-ebook-reader-rag.mjs` |
| Milvus | `09_milvus-test` / `14_prompt-template-test` | `query.mjs`、`ebook-reader-rag.mjs`、`11-semantic-example-selector-milvus.mjs` |
| Runnable | `15_runnable-test` | `00-before.mjs` 到 `09-runnable-with-message-history.mjs` |
| LCEL chain | `16_LCEL-chain` | `01-case/*`、`02-runnable/*` |
| React todo | `02_react-todo` | 待人工确认 |

## 知识点依赖关系

```text
ChatModel
  -> PromptTemplate / ChatPromptTemplate
  -> OutputParser / withStructuredOutput
  -> tool_call / bindTools
  -> Agent 循环

ChatModel + Embeddings
  -> RAG
  -> Milvus / VectorStore
  -> retrieval memory

PromptTemplate + ChatModel + OutputParser + Tool + Retriever
  -> Runnable
  -> LCEL chain
  -> callbacks / retry / fallback / config
```

## 推荐复习顺序

1. `01_tool-test`：先重新理解 ChatModel、messages、tool、ToolMessage 循环。
2. `14_prompt-template-test`：系统复习输入控制，重点看 `04`、`07`、`08`、`11`。
3. `12_output-parser-test`：复习输出控制，重点看 `05`、`09`、`10`。
4. `13_mini_cursor`：理解结构化输出如何变成应用能力，尤其是流式 tool 参数预览。
5. `11_memory-test`：复习上下文管理，区分短期历史、截断、总结、检索。
6. `06_rag-test`：用内存向量库把 RAG 主线跑通。
7. `09_milvus-test`：再看 Milvus 如何把 RAG 变成可扩展存储。
8. `15_runnable-test`：复习 Runnable 基础 API。
9. `16_LCEL-chain`：最后把 tool 和 RAG 用 LCEL 串起来。
10. `02_react-todo`：仅作为低优先级补充，待人工确认是否纳入 LangChain 第一阶段主线。
