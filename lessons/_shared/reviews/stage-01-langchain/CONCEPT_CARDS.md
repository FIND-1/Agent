# 核心概念卡片

## LangChain

- 它是什么：AI 应用开发框架，提供模型、prompt、parser、tool、memory、RAG、Runnable/LCEL 等组件。
- 为什么需要它：不同模型和不同能力的底层 API 差异大，需要统一抽象。
- 解决什么问题：让 AI 应用从零散 demo 变成可组合、可维护、可观测的工程链路。
- 常见使用场景：聊天助手、Agent、RAG 问答、结构化抽取、工具调用、chain 编排。
- 对应 lesson：全部第一阶段 lesson。
- 和其他概念的关系：`ChatModel` 是模型层入口，`LCEL` 是组件编排层。
- 我需要记住的一句话：LangChain 先是组件工具箱，学完 LCEL 后才更像工业流水线。

## BaseChatModel

- 它是什么：LangChain Chat 模型抽象基类。
- 为什么需要它：不同模型 API 格式不同，需要一个统一上层接口。
- 解决什么问题：让调用方用相似方式执行 `invoke`、`stream`、`bindTools` 等操作。
- 常见使用场景：对接 OpenAI、Anthropic、Gemini、DeepSeek、Qwen 等模型。
- 对应 lesson：`01_tool-test`、`lessons/_shared/model.mjs`。
- 和其他概念的关系：`ChatOpenAI`、`ChatAnthropic`、`ChatGoogleGenerativeAI` 等实现它。
- 我需要记住的一句话：BaseChatModel 是 LangChain 屏蔽模型 API 差异的核心边界。

## ChatModel

- 它是什么：对话模型接口，接收 messages 或 prompt，返回 AIMessage / chunk。
- 为什么需要它：真实 AI 应用通常是多轮消息，而不是单个字符串补全。
- 解决什么问题：统一模型调用、流式输出、工具绑定、结构化输出。
- 常见使用场景：聊天、Agent 循环、RAG 生成、结构化抽取。
- 对应 lesson：`01_tool-test`、`12_output-parser-test`、`14_prompt-template-test`、`16_LCEL-chain`。
- 和其他概念的关系：可接在 `ChatPromptTemplate` 后，也可与 `OutputParser` 组成 chain。
- 我需要记住的一句话：业务代码尽量面向 ChatModel，不要直接面向厂商 HTTP 格式。

## ChatOpenAI

- 它是什么：LangChain 的 OpenAI / OpenAI-compatible ChatModel 实现。
- 为什么需要它：很多国产模型兼容 OpenAI API，可以用它统一接入。
- 解决什么问题：用 LangChain 风格调用 OpenAI 兼容模型。
- 常见使用场景：Qwen、DeepSeek 兼容接口、本项目共享 `createChatModel()`。
- 对应 lesson：`lessons/_shared/model.mjs`、多数 lesson 示例。
- 和其他概念的关系：是 `BaseChatModel` 的具体实现，可 `bindTools` 和 `withStructuredOutput`。
- 我需要记住的一句话：OpenAI 兼容模型能用 ChatOpenAI，但专有能力可能需要专用 ChatModel。

## ChatAnthropic

- 它是什么：Anthropic Claude 的 LangChain ChatModel 实现。
- 为什么需要它：Claude 的 system、content block 等格式和 OpenAI 不完全一样。
- 解决什么问题：把 Claude 差异封装到专用模型类里。
- 常见使用场景：使用 Claude 专有能力或原生 Anthropic API。
- 对应 lesson：docx 图片示例，当前项目代码未发现直接使用，待人工确认。
- 和其他概念的关系：和 `ChatOpenAI` 一样实现 ChatModel 抽象。
- 我需要记住的一句话：专用 ChatModel 是为了拿到厂商特性，而不只是为了能发请求。

## ChatGoogleGenerativeAI

- 它是什么：Google Gemini 的 LangChain ChatModel 实现。
- 为什么需要它：Gemini 的 `contents`、`parts`、`system_instruction` 与 OpenAI 格式不同。
- 解决什么问题：把 Gemini 的请求格式适配到 LangChain 的 ChatModel 接口。
- 常见使用场景：接入 Gemini、测试不同模型效果。
- 对应 lesson：docx 图片示例，当前项目代码未发现直接使用，待人工确认。
- 和其他概念的关系：和 `ChatAnthropic`、`ChatOpenAI` 同属模型适配层。
- 我需要记住的一句话：ChatModel 的意义就是让 Gemini 这类差异不扩散到业务代码。

## PromptTemplate

- 它是什么：字符串 prompt 模板，支持变量填充。
- 为什么需要它：避免把动态输入和固定规则混在不可维护的大字符串里。
- 解决什么问题：模板复用、变量注入、格式提示拼接。
- 常见使用场景：单轮任务、RAG context 注入、parser 格式说明注入。
- 对应 lesson：`14_prompt-template-test/src/00-basic-prompt-template.mjs`、`15_runnable-test/src/01-runnable-sequence.mjs`。
- 和其他概念的关系：可以 pipe 到 ChatModel，也可作为 `PipelinePromptTemplate` 的子模板。
- 我需要记住的一句话：PromptTemplate 解决“字符串如何变成可维护模板”。

## ChatPromptTemplate

- 它是什么：生成 Chat 模型 messages 的 prompt 模板。
- 为什么需要它：ChatModel 更自然地消费 `system`、`human`、`ai` 等消息。
- 解决什么问题：角色消息组织、历史消息占位、多轮 prompt 构造。
- 常见使用场景：聊天助手、Agent、带 system 规则的任务。
- 对应 lesson：`14_prompt-template-test/src/04-chat-prompt-template.mjs`、`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 和其他概念的关系：常和 `MessagesPlaceholder`、`RunnableWithMessageHistory` 配合。
- 我需要记住的一句话：ChatPromptTemplate 不是拼字符串，而是在构造 messages。

## MessagesPlaceholder

- 它是什么：ChatPromptTemplate 中的历史消息占位符。
- 为什么需要它：多轮对话不能总是手动把 history 拼成文本。
- 解决什么问题：把历史 messages 原样插入 prompt 的指定位置。
- 常见使用场景：聊天、Agent 循环、memory、RunnableWithMessageHistory。
- 对应 lesson：`14_prompt-template-test/src/07-messages-placeholder-history.mjs`、`15_runnable-test/src/09-runnable-with-message-history.mjs`。
- 和其他概念的关系：和 `Memory`、`ChatMessageHistory`、`RunnableWithMessageHistory` 强相关。
- 我需要记住的一句话：MessagesPlaceholder 管的是消息位置，不负责存储历史。

## PipelinePromptTemplate

- 它是什么：把多个 prompt 模块组合成最终 prompt 的模板。
- 为什么需要它：大型 prompt 需要拆成角色、背景、任务、格式等可复用模块。
- 解决什么问题：prompt 模块化、复用、组合。
- 常见使用场景：周报、OKR 回顾、复杂业务 prompt。
- 对应 lesson：`14_prompt-template-test/src/01-pipeline-prompt-modules.mjs`、`06-pipeline-chat-prompt-template.mjs`。
- 和其他概念的关系：和 `PromptTemplate` 是组合关系，和 `RunnableMap` 都有“多输入汇总”的感觉但层级不同。
- 我需要记住的一句话：PipelinePromptTemplate 管 prompt 模块组合，不是通用流程编排。

## FewShotPromptTemplate

- 它是什么：把少量示例拼进 prompt 的模板。
- 为什么需要它：示例能稳定模型输出风格、结构和粒度。
- 解决什么问题：让模型模仿已知样例，降低输出漂移。
- 常见使用场景：固定格式写作、分类、抽取、报告生成。
- 对应 lesson：`14_prompt-template-test/src/08-fewshot-prompt-template.mjs`。
- 和其他概念的关系：可配合 `LengthBasedExampleSelector` / `SemanticSimilarityExampleSelector` 动态选示例。
- 我需要记住的一句话：Few-shot 的重点是让模型学结构，不是塞越多例子越好。

## OutputParser

- 它是什么：把模型输出解析成目标格式的组件。
- 为什么需要它：模型输出可能包 Markdown、格式不稳定或需要流式解析。
- 解决什么问题：字符串、JSON、XML、tool calls 等输出的解析。
- 常见使用场景：结构化抽取、格式校验、非 JSON 输出、流式工具参数展示。
- 对应 lesson：`12_output-parser-test`。
- 和其他概念的关系：能接在 `ChatModel` 后组成 chain；和 `withStructuredOutput` 是输出控制的两条路径。
- 我需要记住的一句话：OutputParser 是“解析输出”，不是“保证模型一定按格式输出”。

## withStructuredOutput

- 它是什么：ChatModel 上的结构化输出便捷 API。
- 为什么需要它：常见 JSON 结构化输出不应每次手写 parser prompt。
- 解决什么问题：根据 schema 让模型尽量返回符合结构的对象。
- 常见使用场景：信息抽取、智能录入、表单填充、实体结构化。
- 对应 lesson：`12_output-parser-test/src/05-with-structured-output-or-fallback.mjs`、`13_mini_cursor/src/test/01-smart-import-with-structured-output.mjs`。
- 和其他概念的关系：底层可能使用 tool call 或 JSON schema；失败时可 fallback 到 `StructuredOutputParser`。
- 我需要记住的一句话：普通结构化 JSON 优先 withStructuredOutput，复杂流式解析再看 OutputParser。

## tool_call

- 它是什么：模型输出的工具调用意图，包含工具名、参数和 id。
- 为什么需要它：让模型不只是回答，还能请求外部能力。
- 解决什么问题：把自然语言意图转成可执行函数调用。
- 常见使用场景：文件读写、命令执行、MCP、数据库查询、浏览器操作。
- 对应 lesson：`01_tool-test`、`12_output-parser-test`、`16_LCEL-chain`。
- 和其他概念的关系：需要 `bindTools` 暴露工具，需要 `ToolMessage` 把执行结果写回。
- 我需要记住的一句话：tool_call 是模型提出的调用请求，不是工具已经执行完成。

## bindTools

- 它是什么：把工具列表绑定到 ChatModel 的方法。
- 为什么需要它：模型需要知道有哪些工具、每个工具参数 schema 是什么。
- 解决什么问题：让模型在需要时返回 `tool_calls`。
- 常见使用场景：Agent、MCP 工具、结构化输出 fallback、mini cursor。
- 对应 lesson：`01_tool-test/src/tool-file-read.mjs`、`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 和其他概念的关系：绑定后返回的 model 本身仍可作为 Runnable 使用。
- 我需要记住的一句话：bindTools 只是把工具说明交给模型，真正执行工具仍在应用侧。

## JsonOutputToolsParser

- 它是什么：解析 OpenAI tool call 输出的 OutputParser，支持流式。
- 为什么需要它：流式 `tool_call_chunks` 往往是不完整 JSON 片段。
- 解决什么问题：把逐步到来的工具参数片段解析成可观察对象。
- 常见使用场景：流式 mini cursor、参数预览、工具调用调试。
- 对应 lesson：`12_output-parser-test/src/10-stream-tool-calls-parser.mjs`、`13_mini_cursor/src/test/04-stream-mini-cursor.mjs`。
- 和其他概念的关系：和 `tool_call_chunks`、`stream` 强相关。
- 我需要记住的一句话：它适合流式观察参数成型过程，真正执行工具最好等参数完整。

## Memory

- 它是什么：管理对话历史和长期上下文的机制。
- 为什么需要它：把所有 messages 无限塞回模型会超出上下文限制。
- 解决什么问题：短期历史、截断、摘要、检索式长期记忆。
- 常见使用场景：聊天助手、长期任务、Agent 续聊、个性化记忆。
- 对应 lesson：`11_memory-test`、`15_runnable-test/src/09-runnable-with-message-history.mjs`。
- 和其他概念的关系：短期 memory 常用 `ChatMessageHistory`，长期 memory 常结合 RAG / 向量库。
- 我需要记住的一句话：memory 不是模型自动记住，而是应用把该带的上下文带回去。

## RAG

- 它是什么：检索增强生成，把外部知识检索后注入 prompt 再生成。
- 为什么需要它：模型参数知识不等于你的私有文档和最新业务数据。
- 解决什么问题：让模型基于可控资料回答，减少凭空编造。
- 常见使用场景：文档问答、电子书助手、知识库客服、代码库问答。
- 对应 lesson：`06_rag-test`、`09_milvus-test`、`16_LCEL-chain/src/01-case/01-ebook-reader-rag.mjs`。
- 和其他概念的关系：依赖 Embeddings、VectorStore / Milvus、PromptTemplate、ChatModel。
- 我需要记住的一句话：RAG 是“先找资料，再让模型基于资料回答”。

## Milvus

- 它是什么：向量数据库。
- 为什么需要它：内存向量库只能做 demo，真实检索需要可持久化、可索引、可扩展的存储。
- 解决什么问题：高效存储和检索 embedding 向量。
- 常见使用场景：RAG、语义搜索、长时记忆、few-shot 语义示例选择。
- 对应 lesson：`09_milvus-test`、`14_prompt-template-test/src/11-semantic-example-selector-milvus.mjs`。
- 和其他概念的关系：和 `similaritySearch`、`SemanticSimilarityExampleSelector`、retrieval memory 相关。
- 我需要记住的一句话：Milvus 存的是向量和元数据，模型生成前先用它找相关片段。

## Runnable

- 它是什么：LangChain 中可统一执行的组件接口。
- 为什么需要它：prompt、model、parser、函数、分支都需要统一组合方式。
- 解决什么问题：把过程式调用变成声明式 chain。
- 常见使用场景：`pipe`、`RunnableSequence`、`RunnableMap`、callbacks、retry。
- 对应 lesson：`15_runnable-test`、`16_LCEL-chain`。
- 和其他概念的关系：LCEL 的基本单元。
- 我需要记住的一句话：能进入 LCEL chain 的东西，本质上都要像 Runnable 一样被调用。

## RunnableLambda

- 它是什么：把普通函数包装成 Runnable 的工具。
- 为什么需要它：业务转换逻辑也要能进入 chain。
- 解决什么问题：在 LCEL 中插入自定义函数、条件处理、工具执行逻辑。
- 常见使用场景：数据清洗、路由、tool executor、RAG context 拼接。
- 对应 lesson：`15_runnable-test/src/02-runnable-lambda.mjs`、`16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 和其他概念的关系：经常和 `RunnableSequence`、`RunnableBranch` 配合。
- 我需要记住的一句话：RunnableLambda 是把普通 JS 函数接进 LCEL 的桥。

## RunnableMap

- 它是什么：把同一输入并行送入多个 Runnable，并按对象 key 汇总结果。
- 为什么需要它：同一个输入经常需要派生多个中间结果。
- 解决什么问题：并行计算、并行 prompt、结果对象化。
- 常见使用场景：同时生成多个字段、保留多条子链结果。
- 对应 lesson：`15_runnable-test/src/03-runnable-map.mjs`。
- 和其他概念的关系：和 `PipelinePromptTemplate` 都能组合多个输入，但 RunnableMap 是流程级，PipelinePromptTemplate 是 prompt 级。
- 我需要记住的一句话：RunnableMap 解决 chain 里的并行派生，不是 prompt 模块拼装。

## LCEL

- 它是什么：LangChain Expression Language，用声明式方式组合 Runnable。
- 为什么需要它：硬编码流程难维护、难观测、难统一添加 retry/fallback/callbacks。
- 解决什么问题：把组件连接成 chain，并统一执行和增强。
- 常见使用场景：RAG chain、Agent chain、结构化输出 chain、日志和监控。
- 对应 lesson：`16_LCEL-chain`。
- 和其他概念的关系：以 Runnable 为基本单元，用 `pipe`、Sequence、Branch、Map 连接。
- 我需要记住的一句话：LCEL 让 LangChain 从工具集合变成可编排流水线。

## chain

- 它是什么：由多个 Runnable / 组件组成的一条执行链。
- 为什么需要它：AI 应用通常不是一次模型调用，而是多步骤流程。
- 解决什么问题：把 prompt、model、parser、retriever、tool executor 串起来。
- 常见使用场景：`prompt.pipe(model).pipe(parser)`、RAG、Agent step。
- 对应 lesson：`15_runnable-test`、`16_LCEL-chain`。
- 和其他概念的关系：chain 是 LCEL 的落地形态，通过 `invoke` / `stream` / `batch` 执行。
- 我需要记住的一句话：chain 是把多个小组件按流程接好的可执行对象。

## invoke

- 它是什么：Runnable / model / chain 的单次调用方法。
- 为什么需要它：最常见的执行入口。
- 解决什么问题：给一个输入，得到一个输出。
- 常见使用场景：普通问答、RAG 单次问题、结构化抽取。
- 对应 lesson：几乎全部 lesson。
- 和其他概念的关系：和 `stream`、`batch` 是同一 chain 的不同执行方式。
- 我需要记住的一句话：能先用 invoke 跑通，就先别急着上 stream 和 batch。

## stream

- 它是什么：流式调用方法，逐块返回输出。
- 为什么需要它：长输出和工具参数生成过程需要边生成边展示。
- 解决什么问题：降低等待感、观察 tool_call_chunks、实时 UI 输出。
- 常见使用场景：mini cursor、聊天 UI、流式结构化参数展示。
- 对应 lesson：`12_output-parser-test`、`13_mini_cursor`、`16_LCEL-chain`。
- 和其他概念的关系：常和 `JsonOutputToolsParser`、`tool_call_chunks` 配合。
- 我需要记住的一句话：stream 不是只是更快显示文字，也能观察中间结构逐步成型。

## batch

- 它是什么：批量调用方法，对多个输入执行同一 Runnable / chain。
- 为什么需要它：同一流程需要处理多条数据时，不应手写循环散落在业务里。
- 解决什么问题：统一批处理入口。
- 常见使用场景：批量分类、批量翻译、批量抽取、批量评估。
- 对应 lesson：`15_runnable-test`、docx LCEL 总结图。
- 和其他概念的关系：和 `invoke`、`stream` 并列，是 Runnable 的统一执行能力。
- 我需要记住的一句话：batch 是同一条 chain 面向多输入的执行方式。
