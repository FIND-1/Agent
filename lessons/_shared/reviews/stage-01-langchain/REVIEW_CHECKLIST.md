# 第一阶段复习检查清单

## 一、必须掌握的 10 个问题

1. 为什么 LangChain 要抽象 ChatModel？

   因为 OpenAI、Anthropic、Gemini 等模型的请求格式不同，直接耦合厂商 API 会导致切换模型成本很高。LangChain 通过统一 ChatModel 接口把底层差异封装起来。

2. BaseChatModel、ChatModel、ChatOpenAI 的关系是什么？

   `BaseChatModel` 是抽象基类，`ChatModel` 是对话模型能力的统一接口，`ChatOpenAI` 是 OpenAI/OpenAI-compatible 的具体实现。业务代码最好依赖统一接口，而不是厂商 HTTP 格式。

3. PromptTemplate 和 ChatPromptTemplate 有什么区别？

   `PromptTemplate` 主要生成字符串 prompt；`ChatPromptTemplate` 生成 system/human/ai 等 messages，更适合 ChatModel 和多轮对话。

4. MessagesPlaceholder 解决什么问题？

   它在 ChatPromptTemplate 中预留历史消息插入位置，让 history 以 messages 形式进入模型，而不是手动拼接成一段字符串。

5. PipelinePromptTemplate 和 RunnableMap 有什么区别？

   `PipelinePromptTemplate` 是 prompt 内部模块组合工具；`RunnableMap` 是 LCEL 流程级并行执行工具。前者管理 prompt 片段，后者管理 chain 节点。

6. FewShotPromptTemplate 适合什么场景？

   适合需要模型模仿固定格式、表达风格、结构粒度的任务，例如周报、分类、结构化抽取、固定口吻写作。

7. withStructuredOutput 和 OutputParser 有什么区别？

   `withStructuredOutput` 是模型结构化输出的便捷入口，通常优先使用；`OutputParser` 更偏解析层，适合 fallback、非 JSON 格式、流式工具参数和自定义解析。

8. tool_call、bindTools、ToolMessage 三者的关系是什么？

   `bindTools` 把工具说明和 schema 交给模型；模型需要工具时返回 `tool_call`；应用执行工具后用 `ToolMessage` 把结果写回 messages，让模型继续推理。

9. memory 和 RAG 的边界是什么？

   memory 管对话历史和用户上下文；RAG 管外部知识检索。两者都可能用向量检索，但 memory 的数据来源通常是历史对话，RAG 的数据来源通常是文档或知识库。

10. Runnable / LCEL 解决了什么工程问题？

    它把 prompt、model、parser、tool、retriever、普通函数统一成可组合节点，并提供 `invoke`、`stream`、`batch`、callbacks、retry、fallback 等工程能力。

## 二、容易混淆的 10 个问题

### 问题：OpenAI 兼容格式 vs 专用 ChatModel

- 容易混淆点：以为只要兼容 OpenAI API，就不需要厂商专用 ChatModel。
- 正确理解：兼容格式能跑通基础调用，但专用 ChatModel 可能支持厂商独有参数、消息格式和能力。
- 对应 lesson：`01_tool-test`、`lessons/_shared/model.mjs`。
- 复习建议：对比 docx 里的 OpenAI、Anthropic、Gemini system 消息格式。

### 问题：tool_call vs MCP

- 容易混淆点：把 MCP 当成另一种 Agent 循环。
- 正确理解：tool_call 是模型请求调用工具的输出格式；MCP 是工具来源和通信协议。MCP 工具绑定后仍然走 tool_call/ToolMessage 循环。
- 对应 lesson：`01_tool-test/src/mcp`、`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 复习建议：先手写本地 tool，再看 MCP 版 `getTools()`。

### 问题：OutputParser vs withStructuredOutput

- 容易混淆点：以为二者完全替代。
- 正确理解：普通结构化 JSON 优先 `withStructuredOutput`；parser 更适合 fallback、流式解析和非 JSON 格式。
- 对应 lesson：`12_output-parser-test`、`13_mini_cursor`。
- 复习建议：看 `05-with-structured-output-or-fallback.mjs` 的两级实现。

### 问题：JSON schema vs Zod schema

- 容易混淆点：把 Zod schema 当成模型原生 schema。
- 正确理解：Zod 是代码侧定义结构的方式，LangChain 可把它转换成模型可理解的 JSON schema 或 parser 格式说明。
- 对应 lesson：`12_output-parser-test/src/_shared/schemas.mjs`。
- 复习建议：找一个 Zod schema，写出它对应的字段、类型和 describe 说明。

### 问题：Memory vs RAG

- 容易混淆点：二者都可能使用向量数据库，所以容易混为一谈。
- 正确理解：memory 关注“之前聊过什么”；RAG 关注“外部资料里有什么”。检索技术相似，业务边界不同。
- 对应 lesson：`11_memory-test`、`06_rag-test`、`09_milvus-test`。
- 复习建议：分别画一张“对话历史检索”和“文档检索”的数据来源图。

### 问题：MessagesPlaceholder vs ChatMessageHistory

- 容易混淆点：以为 `MessagesPlaceholder` 会保存历史。
- 正确理解：`MessagesPlaceholder` 只是 prompt 中的插入位置；`ChatMessageHistory` 才负责保存和读取 messages。
- 对应 lesson：`14_prompt-template-test/src/07-messages-placeholder-history.mjs`、`11_memory-test/src/history-test.mjs`。
- 复习建议：手写一个 `history` 数组填入 prompt，再用 `InMemoryChatMessageHistory` 重写。

### 问题：PipelinePromptTemplate vs LCEL

- 容易混淆点：二者都像“管道”，容易以为功能一样。
- 正确理解：PipelinePromptTemplate 只组合 prompt 片段；LCEL 组合完整执行节点，包括 prompt、model、parser、retriever、tool executor。
- 对应 lesson：`14_prompt-template-test`、`16_LCEL-chain`。
- 复习建议：用同一周报场景分别画 prompt 模块图和 LCEL 执行图。

### 问题：RunnableSequence vs pipe

- 容易混淆点：以为 `pipe()` 和 `RunnableSequence.from()` 是两种完全不同机制。
- 正确理解：`pipe()` 通常返回顺序链，和显式 `RunnableSequence.from([...])` 本质相近，只是写法不同。
- 对应 lesson：`15_runnable-test/src/01-runnable-sequence.mjs`。
- 复习建议：把一个 `prompt.pipe(model).pipe(parser)` 改写成 `RunnableSequence.from`。

### 问题：RunnableMap vs 普通对象

- 容易混淆点：看到对象字面量就以为只是普通 JS 对象。
- 正确理解：在 LCEL 中对象可能被自动转成 RunnableMap，同一输入会并行进入多个字段对应的 Runnable。
- 对应 lesson：`15_runnable-test/src/03-runnable-map.mjs`、`16_LCEL-chain`。
- 复习建议：给 RunnableMap 增加一个字段，观察输出对象是否多出派生结果。

### 问题：stream vs invoke

- 容易混淆点：以为 stream 只是把最终文本拆成多段。
- 正确理解：stream 不只用于 UI 打字效果，也能观察 tool_call_chunks 这类中间结构逐步成型。
- 对应 lesson：`12_output-parser-test/src/09-stream-tool-calls-raw.mjs`、`13_mini_cursor`。
- 复习建议：先用 `invoke` 看完整结果，再用 `stream` 打印每个 chunk。

## 三、建议重新手写的 5 个 demo

### ChatModel 最小调用 demo

- 目标：确认自己理解统一 ChatModel 调用入口。
- 对应 lesson：`01_tool-test`、`lessons/_shared/model.mjs`。
- 涉及 API：`createChatModel()`、`invoke()`、`HumanMessage`。
- 最小实现步骤：
  1. 从 `@lessons/shared/model` 导入 `createChatModel`。
  2. 创建模型实例。
  3. 传入一条 human 消息或字符串。
  4. 打印 `response.content`。
- 验证方式：能得到模型回复，并能说清楚 `.env` 中哪些变量影响模型。
- 完成标准：能解释为什么业务代码没有直接写 OpenAI HTTP 请求。

### bindTools + ToolMessage 工具调用循环 demo

- 目标：掌握 Agent 工具调用最小闭环。
- 对应 lesson：`01_tool-test/src/tool-file-read.mjs`。
- 涉及 API：`tool()`、`bindTools()`、`ToolMessage`、`tool_calls`。
- 最小实现步骤：
  1. 定义一个 `get_time` 或 `read_file` 工具。
  2. 用 Zod schema 描述参数。
  3. `model.bindTools([tool])`。
  4. 检测 `response.tool_calls`。
  5. 执行工具并把结果作为 `ToolMessage` 写回。
- 验证方式：终端能看到模型先请求工具，再基于工具结果给出最终回复。
- 完成标准：能解释为什么必须带 `tool_call_id`。

### ChatPromptTemplate + MessagesPlaceholder 多轮 prompt demo

- 目标：区分 prompt 占位和历史存储。
- 对应 lesson：`14_prompt-template-test/src/07-messages-placeholder-history.mjs`。
- 涉及 API：`ChatPromptTemplate`、`MessagesPlaceholder`、`formatPromptValue()`。
- 最小实现步骤：
  1. 定义 system 消息。
  2. 插入 `new MessagesPlaceholder("history")`。
  3. 准备 human/ai history 数组。
  4. 填入当前问题。
  5. 打印 `toChatMessages()`。
- 验证方式：输出 messages 中历史消息顺序正确。
- 完成标准：能说明 `MessagesPlaceholder` 不负责保存历史。

### withStructuredOutput + fallback parser demo

- 目标：掌握结构化输出的主路径和降级路径。
- 对应 lesson：`12_output-parser-test/src/05-with-structured-output-or-fallback.mjs`。
- 涉及 API：`withStructuredOutput()`、`StructuredOutputParser.fromZodSchema()`、`ChatPromptTemplate`。
- 最小实现步骤：
  1. 定义一个 Zod schema。
  2. 优先调用 `model.withStructuredOutput(schema)`。
  3. catch 中创建 `StructuredOutputParser`。
  4. 把 `parser.getFormatInstructions()` 注入 prompt。
  5. 用 `prompt.pipe(model).pipe(parser)` 调用。
- 验证方式：主路径或 fallback 至少一个能返回结构化对象。
- 完成标准：能解释为什么流式场景仍可能需要 OutputParser。

### LCEL RAG chain demo

- 目标：把 RAG 流程从手写步骤改成 chain。
- 对应 lesson：`06_rag-test`、`16_LCEL-chain/src/01-case/02-rag-local-fallback-chain.mjs`。
- 涉及 API：`RunnableSequence`、`RunnableLambda`、`PromptTemplate`、`StringOutputParser`。
- 最小实现步骤：
  1. 用本地数组模拟检索片段。
  2. 用 `RunnableLambda` 根据 question 返回 context。
  3. 用 `PromptTemplate` 拼接 question 和 context。
  4. pipe 到 model 和 `StringOutputParser`。
  5. 用 `invoke({ question })` 执行。
- 验证方式：输出回答必须引用本地片段内容。
- 完成标准：能把流程拆成“检索 -> prompt -> model -> parser”四个节点。

## 四、后续 TODO

- `02_react-todo` 是否纳入第一阶段 LangChain 主线，待人工确认。
- `12_output-parser-test` 和 `13_mini_cursor` 的边界，待人工确认；当前 `13_mini_cursor/README.md` 同时覆盖 structured output 和 mini cursor。
- docx 中部分图片代码来自截图，无法保证逐字准确；需要以 lesson 源码和当前 LangChain 文档为准核验。
- Milvus 相关 demo 需要本地服务环境、collection、embedding 维度一致，才能完整验证。
- 部分源码是否存在编码乱码，需要单独检查，例如 `lessons/_shared/model.mjs` 的中文注释在终端中曾显示异常。
- `12_output-parser-test` 缺少独立 README，后续可补一个只面向 OutputParser 的复习入口。
- MCP 相关 demo 涉及外部服务和 `npx` 下载，复习时建议先跑本地自定义 tool。
