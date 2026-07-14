# 图片复习笔记

图片编号来自 docx 正文引用顺序。类型只使用：架构图、流程图、代码截图、终端输出、说明性截图、无法可靠识别。

### image-001

- 图片类型：架构图
- 图片上下文：你如果用 LangChain，就是这样；所有大模型的 api 都实现 BaseChatModel。
- 图片讲了什么：LangChain 位于上层，下面通过 `BaseChatModel` 统一连接 ChatOpenAI、ChatAnthropic、ChatGoogleGenerativeAI、ChatDeepSeek、ChatAlibabaTongyi 等具体模型。
- 对应知识点：LangChain、BaseChatModel、ChatModel。
- 对应 lesson：`01_tool-test`、`lessons/_shared/model.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：第一阶段理解“为什么需要 LangChain”的核心图。

### image-002

- 图片类型：代码截图
- 图片上下文：`@langchain/google-genai` 包示例。
- 图片讲了什么：使用 `ChatGoogleGenerativeAI` 初始化 Gemini 模型并调用 `invoke`。
- 对应知识点：ChatGoogleGenerativeAI、ChatModel 专用实现。
- 对应 lesson：当前项目未发现直接使用，关联 `01_tool-test`，待人工确认。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：导入 `ChatGoogleGenerativeAI` 和 `HumanMessage`，创建 Gemini 模型后调用。
- 对复习是否重要：是。
- 重要程度：中
- 备注：代码来自截图，无法保证逐字准确。

### image-003

- 图片类型：代码截图
- 图片上下文：`@langchain/deepseek` 包示例。
- 图片讲了什么：使用 `ChatDeepSeek` 和 DeepSeek API Key 初始化专用 ChatModel。
- 对应知识点：OpenAI 兼容格式 vs 专用 ChatModel。
- 对应 lesson：`01_tool-test`，当前项目未发现直接使用 DeepSeek 专用类，待人工确认。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：导入 `ChatDeepSeek`，传入 `apiKey` 和模型名后 `invoke`。
- 对复习是否重要：是。
- 重要程度：中
- 备注：用于理解专用 ChatModel 的意义。

### image-004

- 图片类型：代码截图
- 图片上下文：`@langchain/anthropic` 包示例。
- 图片讲了什么：使用 `ChatAnthropic` 初始化 Claude 模型并调用。
- 对应知识点：ChatAnthropic、厂商专用模型适配。
- 对应 lesson：`01_tool-test`，当前项目未发现直接使用，待人工确认。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：导入 `ChatAnthropic`，使用 `ANTHROPIC_API_KEY` 创建模型并 `invoke`。
- 对复习是否重要：是。
- 重要程度：中
- 备注：代码来自截图，建议只记 API 形态。

### image-005

- 图片类型：说明性截图
- 图片上下文：比如我司项目里就用到了各种大模型。
- 图片讲了什么：项目技术栈中列出 OpenAI、Anthropic、阿里 Qwen、Google Vertex AI、Ollama、AWS Bedrock 等模型供应方或 SDK。
- 对应知识点：多模型接入、统一抽象。
- 对应 lesson：`lessons/_shared/model.mjs`、`01_tool-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：强调真实项目会同时接入多类模型。

### image-006

- 图片类型：架构图
- 图片上下文：通过 BaseChatModel 屏蔽模型差异后，再对输入、输出做控制。
- 图片讲了什么：`PromptTemplate -> ChatModel -> OutputParser` 的基本调用链，ChatModel 可连接不同底层模型。
- 对应知识点：PromptTemplate、ChatModel、OutputParser。
- 对应 lesson：`14_prompt-template-test`、`12_output-parser-test`、`15_runnable-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：这是组件主线的总图。

### image-007

- 图片类型：代码截图
- 图片上下文：通过 ChatPromptTemplate 创建 prompt 模板。
- 图片讲了什么：用 `ChatPromptTemplate.fromMessages` 定义 system/human 模板并填充变量。
- 对应知识点：ChatPromptTemplate、formatMessages。
- 对应 lesson：`14_prompt-template-test/src/04-chat-prompt-template.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：定义周报场景的 system/human messages，并传入公司、团队、周报数据等变量。
- 对复习是否重要：是。
- 重要程度：高
- 备注：建议结合 lesson 14 手写。

### image-008

- 图片类型：代码截图
- 图片上下文：如果是对话记录，是通过 MessagePlaceHolder 传入。
- 图片讲了什么：在 `ChatPromptTemplate` 中插入 `MessagesPlaceholder("history")`。
- 对应知识点：MessagesPlaceholder、历史消息注入。
- 对应 lesson：`14_prompt-template-test/src/07-messages-placeholder-history.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：system 消息、历史占位符、当前 human 输入组成多轮 prompt。
- 对复习是否重要：是。
- 重要程度：高
- 备注：截图中 `MessagePlaceHolder` 文案应理解为 `MessagesPlaceholder`。

### image-009

- 图片类型：代码截图
- 图片上下文：如果是对话记录，是通过 MessagePlaceHolder 传入。
- 图片讲了什么：构造 history messages，并通过 `formatPromptValue` 填入 `history` 和 `current_input`。
- 对应知识点：MessagesPlaceholder、ChatPromptValue。
- 对应 lesson：`14_prompt-template-test/src/07-messages-placeholder-history.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：把 human/ai 历史消息数组传给 prompt，输出包含历史的 messages。
- 对复习是否重要：是。
- 重要程度：高
- 备注：重点是区分“占位符”和“历史存储”。

### image-010

- 图片类型：代码截图
- 图片上下文：多个 PromptTemplate 可以用 PipelinePromptTemplate 组合。
- 图片讲了什么：定义多个 prompt block，再通过 `PipelinePromptTemplate` 组合成最终 prompt。
- 对应知识点：PipelinePromptTemplate、prompt 模块化。
- 对应 lesson：`14_prompt-template-test/src/01-pipeline-prompt-modules.mjs`、`06-pipeline-chat-prompt-template.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：人设、背景、任务、格式等模板作为 `pipelinePrompts` 进入最终模板。
- 对复习是否重要：是。
- 重要程度：高
- 备注：代码截图无法逐字核验，按 API 形态复习。

### image-011

- 图片类型：流程图
- 图片上下文：指定多个 pipelinePrompts，然后指定最终的 finalPrompt。
- 图片讲了什么：多个 PromptTemplate 输入到 `PipelinePromptTemplate`，再由 finalPrompt 生成最终 Prompt。
- 对应知识点：PipelinePromptTemplate。
- 对应 lesson：`14_prompt-template-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：适合理解“prompt 内部模块组合”。

### image-012

- 图片类型：代码截图
- 图片上下文：有时还需要加入一些示例，用 FewShotPromptTemplate。
- 图片讲了什么：创建 `FewShotPromptTemplate`，包含 examples、examplePrompt、prefix、suffix、inputVariables。
- 对应知识点：FewShotPromptTemplate。
- 对应 lesson：`14_prompt-template-test/src/08-fewshot-prompt-template.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：把少量示例拼进 prompt，让模型学习周报格式和表达。
- 对复习是否重要：是。
- 重要程度：高
- 备注：建议结合 image-013 和 image-014 看完整链路。

### image-013

- 图片类型：代码截图
- 图片上下文：指定模板和填入的值就可以了。
- 图片讲了什么：定义单条示例模板与 examples 数组。
- 对应知识点：examplePrompt、few-shot examples。
- 对应 lesson：`14_prompt-template-test/src/08-fewshot-prompt-template.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：每条示例包含用户请求和对应输出片段。
- 对复习是否重要：是。
- 重要程度：中
- 备注：示例内容只需理解结构，不必背文本。

### image-014

- 图片类型：终端输出
- 图片上下文：生成的是带少量示例的 prompt。
- 图片讲了什么：终端展示最终 few-shot prompt，红框标出多条示例。
- 对应知识点：FewShotPromptTemplate 输出结果。
- 对应 lesson：`14_prompt-template-test/src/08-fewshot-prompt-template.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：用于验证 few-shot 是否真的被拼入 prompt。

### image-015

- 图片类型：代码截图
- 图片上下文：根据长度、语义来做示例选择。
- 图片讲了什么：使用 Milvus 向量库和 `SemanticSimilarityExampleSelector` 选择示例。
- 对应知识点：SemanticSimilarityExampleSelector、Milvus、few-shot。
- 对应 lesson：`14_prompt-template-test/src/11-semantic-example-selector-milvus.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：连接已有 Milvus collection，设置 `k`，让 selector 选择最相似示例。
- 对复习是否重要：是。
- 重要程度：高
- 备注：依赖 Milvus 和 embeddings。

### image-016

- 图片类型：代码截图
- 图片上下文：根据长度、语义来做示例选择。
- 图片讲了什么：使用 `LengthBasedExampleSelector` 按长度预算筛选 few-shot 示例。
- 对应知识点：LengthBasedExampleSelector。
- 对应 lesson：`14_prompt-template-test/src/09-length-based-example-selector.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：根据 `maxLength` 和 `getTextLength` 控制示例数量。
- 对复习是否重要：是。
- 重要程度：中
- 备注：长度选择和语义选择要分开理解。

### image-017

- 图片类型：架构图
- 图片上下文：这些就是 Prompt Template 的核心 api。
- 图片讲了什么：PromptTemplate 分支出字符串模板、聊天模板、历史占位、Pipeline、FewShot 和 ExampleSelector。
- 对应知识点：PromptTemplate 全家桶。
- 对应 lesson：`14_prompt-template-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：适合作为 lesson 14 的知识地图。

### image-018

- 图片类型：代码截图
- 图片上下文：结构化输出依赖 tool_call、json schema。
- 图片讲了什么：用 schema 描述科学家信息结构，并绑定为工具调用或结构化输出。
- 对应知识点：tool_call、schema、structured output。
- 对应 lesson：`12_output-parser-test`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：定义 name、birth_year、nationality、fields 等结构字段。
- 对复习是否重要：是。
- 重要程度：高
- 备注：代码来自截图，只保留结构理解。

### image-019

- 图片类型：代码截图
- 图片上下文：结构化输出依赖 tool_call、json schema。
- 图片讲了什么：用模型或客户端配置 JSON schema / tool call，让输出符合指定结构。
- 对应知识点：JSON schema、tool call、structured output。
- 对应 lesson：`12_output-parser-test`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：请求模型返回科学家结构化字段，终端显示 JSON-like 结果。
- 对复习是否重要：是。
- 重要程度：高
- 备注：需结合 `withStructuredOutput` 理解。

### image-020

- 图片类型：代码截图
- 图片上下文：如果都不支持，也可以用 OutputParser。
- 图片讲了什么：使用 `StructuredOutputParser` 生成格式说明，并解析模型输出。
- 对应知识点：OutputParser、format instructions。
- 对应 lesson：`12_output-parser-test/src/05-with-structured-output-or-fallback.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：parser 从 schema 生成格式要求，prompt 携带要求后调用模型并解析。
- 对复习是否重要：是。
- 重要程度：高
- 备注：这是 `withStructuredOutput` 失败后的 fallback 思路。

### image-021

- 图片类型：代码截图
- 图片上下文：直接调用 `model.withStructuredOutput`。
- 图片讲了什么：用 schema 创建 structuredModel，再调用 `invoke` 得到结构化 JSON。
- 对应知识点：withStructuredOutput、Zod/schema。
- 对应 lesson：`12_output-parser-test/src/05-with-structured-output-or-fallback.mjs`、`13_mini_cursor`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：定义科学家 schema，`model.withStructuredOutput(schema)` 后请求介绍人物。
- 对复习是否重要：是。
- 重要程度：高
- 备注：普通结构化输出的优先复习入口。

### image-022

- 图片类型：说明性截图
- 图片上下文：智能录入数据的例子。
- 图片讲了什么：Smart Import UI 中输入一段自然语言，让 AI 分析并抽取结构化数据。
- 对应知识点：structured output、智能录入。
- 对应 lesson：`13_mini_cursor`、`12_output-parser-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：展示结构化输出的产品场景。

### image-023

- 图片类型：说明性截图
- 图片上下文：智能录入数据的例子。
- 图片讲了什么：数据库表或管理工具中展示 AI 抽取后的结构化行数据。
- 对应知识点：structured output -> 数据落地。
- 对应 lesson：`13_mini_cursor`，`12_output-parser-test` 边界待人工确认。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：说明输出控制最终服务于数据消费。

### image-024

- 图片类型：代码截图
- 图片上下文：用 JsonOutputToolsParser 解析流式内容。
- 图片讲了什么：流式 mini cursor 中用 `AIMessageChunk.concat` 和 `JsonOutputToolsParser` 解析工具参数。
- 对应知识点：JsonOutputToolsParser、stream、tool_call_chunks。
- 对应 lesson：`13_mini_cursor/src/test/04-stream-mini-cursor.mjs`、`12_output-parser-test/src/10-stream-tool-calls-parser.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：循环读取 stream chunk，解析工具调用参数并显示。
- 对复习是否重要：是。
- 重要程度：高
- 备注：流式工具参数预览的核心截图。

### image-025

- 图片类型：终端输出
- 图片上下文：之前流式返回的内容是这样。
- 图片讲了什么：原始 chunk 中的 `tool_call_chunks` 只包含部分 args 字符串。
- 对应知识点：tool_call_chunks、stream 原始形态。
- 对应 lesson：`12_output-parser-test/src/09-stream-tool-calls-raw.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：输出片段类似不完整 JSON 参数。
- 对复习是否重要：是。
- 重要程度：高
- 备注：说明为什么不能自己简单 JSON.parse 每个 chunk。

### image-026

- 图片类型：终端输出
- 图片上下文：用了 JsonOutputToolsParser 是这样的。
- 图片讲了什么：解析后的工具参数逐步变成 JSON 对象。
- 对应知识点：JsonOutputToolsParser、流式解析。
- 对应 lesson：`12_output-parser-test/src/10-stream-tool-calls-parser.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：与 image-025 对比复习。

### image-027

- 图片类型：代码截图
- 图片上下文：定义 tool，加 name、description、参数 schema。
- 图片讲了什么：定义 `read_file` tool，并通过 `model.bindTools(tools)` 绑定。
- 对应知识点：tool、bindTools、schema。
- 对应 lesson：`01_tool-test/src/tool-file-read.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：工具读取文件，schema 中描述 `filePath` 参数。
- 对复习是否重要：是。
- 重要程度：高
- 备注：Agent 工具调用的第一步。

### image-028

- 图片类型：终端输出
- 图片上下文：模型在需要调用 tool 时返回 tool_calls 信息。
- 图片讲了什么：终端展示 `tool_calls`，包含 name、args、type、id。
- 对应知识点：tool_call。
- 对应 lesson：`01_tool-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：证明模型只是返回工具调用请求。

### image-029

- 图片类型：流程图
- 图片上下文：按照 schema 填充参数，并根据 tool_calls 调工具。
- 图片讲了什么：SystemMessage/HumanMessage 输入 LLM，LLM 返回 AIMessage 和 tool_calls。
- 对应知识点：messages、AIMessage、tool_calls。
- 对应 lesson：`01_tool-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：是 tool 循环的前半段。

### image-030

- 图片类型：流程图
- 图片上下文：之后继续循环调用。
- 图片讲了什么：把 AIMessage 和 ToolMessage 加入 messages 后再次 invoke LLM。
- 对应知识点：ToolMessage、Agent loop。
- 对应 lesson：`01_tool-test`、`16_LCEL-chain`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：强调工具结果必须写回上下文。

### image-031

- 图片类型：流程图
- 图片上下文：直到没有新的 tool_call，循环结束。
- 图片讲了什么：用户、LLM、tools 之间的循环：query、tool_calls、response。
- 对应知识点：Agent 工具循环。
- 对应 lesson：`01_tool-test`、`16_LCEL-chain`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：同一媒体文件在 `image-036` 被重复引用。

### image-032

- 图片类型：架构图
- 图片上下文：MCP 是可跨进程调用的 tool。
- 图片讲了什么：LLM 通过 tools 调用不同 MCP Client，再连接本地或远程 MCP Server。
- 对应知识点：MCP、stdio、http。
- 对应 lesson：`01_tool-test/src/mcp/langchain-mcp-test.mjs`、`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：说明 MCP 不改变 tool_call 主循环。

### image-033

- 图片类型：代码截图
- 图片上下文：本地进程 stdio，否则 http 通信。
- 图片讲了什么：配置 `MultiServerMCPClient`，同时连接高德 streamable HTTP 和 Chrome DevTools stdio。
- 对应知识点：MultiServerMCPClient、MCP transports。
- 对应 lesson：`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：一个 MCP server 通过 URL 连接，另一个通过 command/args 启动。
- 对复习是否重要：是。
- 重要程度：高
- 备注：涉及外部 API Key 和 npx 下载，运行需谨慎。

### image-034

- 图片类型：说明性截图
- 图片上下文：在 cursor 等编辑器里配置 MCP Server 后可以看到 tools。
- 图片讲了什么：MCP 工具列表 UI，展示地图、路径、天气等工具。
- 对应知识点：MCP tools。
- 对应 lesson：`01_tool-test/src/mcp`、`16_LCEL-chain`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：说明 MCP Server 对外暴露的是工具集合。

### image-035

- 图片类型：代码截图
- 图片上下文：用 `@langchain/mcp-adapters` 和 MCP Server 通信。
- 图片讲了什么：通过 `MultiServerMCPClient` 获取 tools，再 `model.bindTools(tools)`。
- 对应知识点：MCP adapter、getTools、bindTools。
- 对应 lesson：`01_tool-test/src/mcp/langchain-mcp-test.mjs`、`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：初始化 MCP client，`getTools()`，绑定到模型。
- 对复习是否重要：是。
- 重要程度：高
- 备注：MCP 工具和本地工具绑定后使用方式相同。

### image-036

- 图片类型：流程图
- 图片上下文：依然是这个循环。
- 图片讲了什么：重复展示用户、LLM、tools 的 tool_call 循环。
- 对应知识点：Agent loop、MCP tool loop。
- 对应 lesson：`01_tool-test`、`16_LCEL-chain`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：与 `image-031` 使用同一媒体文件，是重复引用。

### image-037

- 图片类型：说明性截图
- 图片上下文：cursor token 到上限会触发总结。
- 图片讲了什么：Cursor 输入框显示上下文使用比例。
- 对应知识点：上下文窗口、memory 触发背景。
- 对应 lesson：`11_memory-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：产品截图，只说明现象。

### image-038

- 图片类型：说明性截图
- 图片上下文：cursor token 到上限会触发总结。
- 图片讲了什么：Cursor 对话中出现 chat context summarized 之类的总结记录。
- 对应知识点：summarization memory。
- 对应 lesson：`11_memory-test/src/memory/summarization-memory.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：部分文字模糊，但上下文可识别。

### image-039

- 图片类型：说明性截图
- 图片上下文：claude code。
- 图片讲了什么：Claude Code 显示上下文剩余比例和 auto-compact 提示。
- 对应知识点：上下文压缩、memory。
- 对应 lesson：`11_memory-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：产品截图。

### image-040

- 图片类型：说明性截图
- 图片上下文：claude code。
- 图片讲了什么：Claude Code compact 后继续会话，并显示 summary 作为前文替代。
- 对应知识点：summary memory。
- 对应 lesson：`11_memory-test/src/memory/summarization-memory2.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：用于说明摘要记忆的产品形态。

### image-041

- 图片类型：架构图
- 图片上下文：一般用 ChatMessageHistory 的 api。
- 图片讲了什么：`BaseChatMessageHistory` 分支到内存、Redis、文件、TypeORM/MySQL 等历史存储实现。
- 对应知识点：ChatMessageHistory、memory storage。
- 对应 lesson：`11_memory-test/src/history-test.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：注意它解决存储，不解决截断/总结策略本身。

### image-042

- 图片类型：说明性截图
- 图片上下文：把内容向量化后通过夹角判断相似度。
- 图片讲了什么：二维向量空间里 Apple、Fruit、Banana、Stone 的方向夹角关系。
- 对应知识点：embedding、cosine similarity。
- 对应 lesson：`06_rag-test`、`09_milvus-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：帮助直觉理解语义相似度。

### image-043

- 图片类型：说明性截图
- 图片上下文：实际向量维度很大，比如 1024。
- 图片讲了什么：Milvus collection 数据视图，包含向量字段和文本字段。
- 对应知识点：Milvus、vector field、metadata。
- 对应 lesson：`09_milvus-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：展示向量数据库中真实存储形态。

### image-044

- 图片类型：说明性截图
- 图片上下文：实际向量维度很大，比如 1024。
- 图片讲了什么：Milvus schema 视图，vector 字段为 FloatVector(1024)，metric 为 COSINE。
- 对应知识点：Milvus schema、向量维度、COSINE。
- 对应 lesson：`09_milvus-test`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：维度不一致是 Milvus demo 常见坑。

### image-045

- 图片类型：流程图
- 图片上下文：首先内容存入向量数据库。
- 图片讲了什么：Word/PDF/网页/YouTube/X 等来源经过 Loader、TextSplitter、Embeddings 后存入向量数据库。
- 对应知识点：RAG indexing、loader、splitter、embeddings。
- 对应 lesson：`06_rag-test/src/loader-and-spiltter.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：RAG 入库流程图。

### image-046

- 图片类型：说明性截图
- 图片上下文：内容存入向量数据库后。
- 图片讲了什么：Milvus collection 中电子书片段与向量字段。
- 对应知识点：Milvus 存储、RAG 文档片段。
- 对应 lesson：`09_milvus-test/src/ebook-writer.mjs`、`ebook-query.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：中
- 备注：与 image-045 搭配看入库结果。

### image-047

- 图片类型：流程图
- 图片上下文：query 向量化后做相似度匹配，让大模型生成回答。
- 图片讲了什么：用户 query 经过 embedding 检索向量库，相关片段作为 context 进入 LLM。
- 对应知识点：RAG retrieval、context injection。
- 对应 lesson：`06_rag-test/src/hello-rag.mjs`、`09_milvus-test/src/ebook-reader-rag.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：RAG 查询流程图。

### image-048

- 图片类型：终端输出
- 图片上下文：电子书阅读助手。
- 图片讲了什么：终端显示检索出的片段、相似度和片段内容。
- 对应知识点：RAG 检索结果、Milvus search。
- 对应 lesson：`09_milvus-test/src/ebook-reader-rag.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：验证检索阶段是否正常。

### image-049

- 图片类型：终端输出
- 图片上下文：基于语义相关片段生成回答。
- 图片讲了什么：终端展示检索片段和最终 AI 回答。
- 对应知识点：RAG generation。
- 对应 lesson：`09_milvus-test/src/ebook-reader-rag.mjs`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：展示 RAG 从检索到生成的完整效果。

### image-050

- 图片类型：代码截图
- 图片上下文：LangChain 有一层封装，在 `@langchain/community` 包下。
- 图片讲了什么：导入 `Milvus` vectorstore 和 `SemanticSimilarityExampleSelector`。
- 对应知识点：LangChain Milvus 封装、vectorstore。
- 对应 lesson：`14_prompt-template-test/src/11-semantic-example-selector-milvus.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：从 `@langchain/community/vectorstores/milvus` 导入 Milvus。
- 对复习是否重要：是。
- 重要程度：中
- 备注：docx 中 `@langchin/comunity` 是原文拼写，实际包名需核验。

### image-051

- 图片类型：代码截图
- 图片上下文：LangChain 的 Milvus 封装更好。
- 图片讲了什么：使用 `Milvus.fromExistingCollection` 创建 vectorStore，并配置索引参数。
- 对应知识点：Milvus vectorstore、indexCreateOptions。
- 对应 lesson：`14_prompt-template-test/src/11-semantic-example-selector-milvus.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：连接已有 collection，设置 COSINE、nlist、nprobe。
- 对复习是否重要：是。
- 重要程度：高
- 备注：与直接 `MilvusClient.search` 对比理解封装层。

### image-052

- 图片类型：代码截图
- 图片上下文：调用 `similaritySearchVectorWithScore` 做相似度检索。
- 图片讲了什么：在 LangChain Milvus vectorStore 上执行向量相似度搜索。
- 对应知识点：similarity search、VectorStore。
- 对应 lesson：`09_milvus-test`、`14_prompt-template-test`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：连接 collection 后调用 `similaritySearchVectorWithScore(currentScenario, 2)`。
- 对复习是否重要：是。
- 重要程度：中
- 备注：方法名和参数需以当前 LangChain 版本为准。

### image-053

- 图片类型：说明性截图
- 图片上下文：Runnable API 可以连接不同组件。
- 图片讲了什么：编辑器自动补全展示 RunnableAssign、RunnableBinding、RunnableBranch、RunnableLambda、RunnableMap 等 API。
- 对应知识点：Runnable API。
- 对应 lesson：`15_runnable-test`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：不是完整代码，是 API 自动补全列表。
- 对复习是否重要：是。
- 重要程度：中
- 备注：适合作为 Runnable 家族索引。

### image-054

- 图片类型：流程图
- 图片上下文：调用方式有 invoke、stream、batch 三种。
- 图片讲了什么：同一 Runnable 链可以用 invoke 单次、batch 批量、stream 流式执行。
- 对应知识点：invoke、stream、batch。
- 对应 lesson：`15_runnable-test`、`16_LCEL-chain`。
- 是否包含代码：否。
- 如果包含代码，代码大意是什么：无。
- 对复习是否重要：是。
- 重要程度：高
- 备注：Runnable 统一执行入口的核心图。

### image-055

- 图片类型：代码截图
- 图片上下文：加耗时、token、输入输出日志等逻辑。
- 图片讲了什么：给 chain 调用传入 callbacks，记录每个节点开始、结束和输出。
- 对应知识点：callbacks、observability。
- 对应 lesson：`16_LCEL-chain/src/02-runnable/03-RunnableWithCallbacks.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：定义 callback handler，然后 `chain.invoke(input, { callbacks })`。
- 对复习是否重要：是。
- 重要程度：高
- 备注：后续理解 LangSmith 的基础。

### image-056

- 图片类型：代码截图
- 图片上下文：每个节点自带重试、备选方案、配置等功能。
- 图片讲了什么：使用 `withRetry` 给 Runnable 节点增加自动重试。
- 对应知识点：withRetry。
- 对应 lesson：`16_LCEL-chain/src/02-runnable/00-RunnableWithRetry.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：不稳定 Runnable 通过 `withRetry({ stopAfterAttempt: 5 })` 增强。
- 对复习是否重要：是。
- 重要程度：中
- 备注：工程增强能力之一。

### image-057

- 图片类型：代码截图
- 图片上下文：每个节点自带重试、备选方案、配置等功能。
- 图片讲了什么：使用 `withFallbacks` 设置主方案失败后的备选 Runnable。
- 对应知识点：withFallbacks。
- 对应 lesson：`16_LCEL-chain/src/02-runnable/01-RunnableWithFallbacks.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：premium 翻译失败后 fallback 到 standard/local translator。
- 对复习是否重要：是。
- 重要程度：中
- 备注：适合和模型降级、parser fallback 联想。

### image-058

- 图片类型：代码截图
- 图片上下文：每个节点自带重试、备选方案、配置等功能。
- 图片讲了什么：使用 `withConfig` 或运行时配置，让 Runnable 根据 config 执行。
- 对应知识点：withConfig、Runnable config。
- 对应 lesson：`16_LCEL-chain/src/02-runnable/02-RunnableWithConfig.mjs`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：从 configurable 中读取角色、地区、时区等配置影响输出。
- 对复习是否重要：是。
- 重要程度：中
- 备注：截图包含终端输出，代码细节需回源码核验。

### image-059

- 图片类型：代码截图
- 图片上下文：多练习写几个 chain 就会了。
- 图片讲了什么：较复杂的 LCEL chain 示例，函数自动转 RunnableLambda，对象自动转 RunnableMap。
- 对应知识点：LCEL、RunnableSequence、RunnableMap、自动 coercion。
- 对应 lesson：`15_runnable-test`、`16_LCEL-chain`。
- 是否包含代码：是。
- 如果包含代码，代码大意是什么：用 RunnableSequence 串联 prompt、model、tool call 判断、状态更新等步骤。
- 对复习是否重要：是。
- 重要程度：高
- 备注：建议最后复习，先掌握基础 Runnable 再看复杂 chain。
