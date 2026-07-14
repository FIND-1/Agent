# 第一阶段 LangChain 学习复盘包

这份复盘包基于 `lessons/_shared/sources/SUMMARY_RULES.docx` 整理，用来回顾 AI Agent / LangChain 第一阶段学习主线。它不是某个单独 lesson 的 README，而是把第一阶段学过的组件、代码示例、截图和复习问题重新组织成一套后续复习入口。

本次没有把根目录的 `SUMMARY_RULES.md` 当作 docx 替代源；该 md 是整理规范，不是文章正文。docx 中的正文、流程图、代码截图、终端截图都已按主题拆分到本目录各文件。

## 对应 lesson

| lesson | 对应主题 | 关联强度 | 说明 |
| --- | --- | --- | --- |
| `01_tool-test` | tool / tool_call / bindTools / MCP | 高 | 对应 docx 中工具定义、`bindTools`、`ToolMessage` 循环、MCP 工具复用。 |
| `02_react-todo` | React todo 示例 | 低 | docx 主线几乎不讲 React todo，仅可作为早期前端练习背景，标记为待人工确认。 |
| `06_rag-test` | RAG / loader / splitter / MemoryVectorStore | 高 | 对应 RAG 的 load、split、embed、store、retrieve、generate 流程。 |
| `09_milvus-test` | Milvus / 向量数据库 / similarity search | 高 | 对应 Milvus 检索、余弦相似度、电子书阅读助手。 |
| `11_memory-test` | memory / 对话历史 / 长时记忆 | 高 | 对应 ChatMessageHistory、截断、总结、检索三类 memory 策略。 |
| `12_output-parser-test` | OutputParser / structured output / JSON 解析 | 高 | 对应 `withStructuredOutput`、`StructuredOutputParser`、`JsonOutputToolsParser`。当前 lesson 无 README，边界需人工确认。 |
| `13_mini_cursor` | mini cursor / 流式输出 / tool_call_chunks | 高 | 对应流式 mini cursor、`tool_call_chunks`、结构化数据落地。 |
| `14_prompt-template-test` | PromptTemplate / ChatPromptTemplate / FewShotPromptTemplate | 高 | 对应 prompt 组件化、历史消息、pipeline、few-shot、example selector。 |
| `15_runnable-test` | Runnable / RunnableLambda / RunnableMap | 高 | 对应 Runnable 基础 API、顺序/并行/分支/历史包装。 |
| `16_LCEL-chain` | LCEL / chain 编排 / pipe / invoke / stream / batch | 高 | 对应用 LCEL 把 tool、RAG、Prompt、Parser 编排成 chain。 |

## 推荐阅读顺序

1. 先读 [REVIEW_MAP.md](./REVIEW_MAP.md)：建立第一阶段知识地图，知道 LangChain 主线如何从“组件”走到“chain”。
2. 再读 [CONCEPT_CARDS.md](./CONCEPT_CARDS.md)：逐个复习核心概念，尤其是容易混淆的 API 边界。
3. 接着读 [CODE_REVIEW_NOTES.md](./CODE_REVIEW_NOTES.md)：把 docx 中的代码截图和各 lesson 里的关键代码对应起来。
4. 需要回看图片时读 [IMAGE_NOTES.md](./IMAGE_NOTES.md)：按 `image-001` 到 `image-059` 查图意、类型和对应 lesson。
5. 最后读 [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md)：用问题清单和 5 个 demo 检查是否真正掌握。

## 每个复盘文件的作用

| 文件 | 作用 |
| --- | --- |
| `README.md` | 说明复盘包范围、对应 lesson、阅读顺序和阶段结论。 |
| `REVIEW_MAP.md` | 按学习主线重组第一阶段知识，给出 lesson 映射和依赖关系。 |
| `CONCEPT_CARDS.md` | 把核心概念拆成复习卡片，便于隔几天后快速恢复上下文。 |
| `CODE_REVIEW_NOTES.md` | 记录 docx 代码截图、关键 lesson 代码、API 目的和最小复现路径。 |
| `IMAGE_NOTES.md` | 对 docx 中所有图片引用编号、分类、说明，并标记是否含代码。 |
| `REVIEW_CHECKLIST.md` | 提供必须掌握问题、易混问题、建议重写 demo 和后续 TODO。 |
| `EXECUTION_REPORT.md` | 记录实际读取来源、生成文件、图片识别情况和待人工确认项。 |

## 第一阶段最重要的 5 个结论

1. LangChain 的入口价值是统一 `ChatModel`：OpenAI、Anthropic、Gemini、国产 OpenAI 兼容模型的底层 API 不同，但业务代码应尽量面向统一的 ChatModel 接口。
2. Prompt 不是简单字符串：真实项目需要 `PromptTemplate`、`ChatPromptTemplate`、`MessagesPlaceholder`、`PipelinePromptTemplate` 和 few-shot 机制来管理输入。
3. 输出控制要分层理解：能用 `withStructuredOutput` 时优先用它；流式、非 JSON、工具参数渐进展示等场景仍需要 `OutputParser`。
4. Agent 的核心循环是 `tool_calls -> 执行工具 -> ToolMessage 写回 messages -> 再 invoke`，MCP 只是工具来源的扩展，不改变这个循环。
5. 学完组件之后必须学 LCEL：Runnable / LCEL 把 prompt、model、parser、tool、retriever 等组件连接成可观测、可重试、可 fallback 的 chain。

## 本次不确定项

- `02_react-todo` 与 docx 主线没有直接对应，低优先级关联，待人工确认。
- `12_output-parser-test` 没有单独 README，`13_mini_cursor/README.md` 同时覆盖了 structured output 和 mini cursor，lesson 12/13 的文档边界待人工确认。
- docx 中图片较多，部分终端截图或 UI 截图只适合识别大意；无法逐字保证截图代码完全准确。
