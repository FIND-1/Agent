# 代码复盘笔记

本文件整理两类代码：

- docx 中出现的代码截图或 API 示例。
- 第一阶段 lesson 中与 docx 主线直接对应的关键代码。

凡是来自图片截图的代码，都按“API 形态”转写，不能当作可直接复制运行的最终代码。

## 代码片段：不同模型 API 调用格式对比

- 来源：docx 正文示例，图片前文字。
- 对应 lesson：`01_tool-test`、`lessons/_shared/model.mjs`。
- 代码目的：说明 OpenAI、Anthropic、Gemini 的请求格式不同，LangChain 需要统一 ChatModel 抽象。
- 关键 API：厂商 HTTP API、`BaseChatModel`。
- 输入是什么：system 指令、user 消息、模型名。
- 输出是什么：不同厂商格式下的模型回复。
- 这段代码解决的问题：证明直接耦合厂商 API 会导致切换模型成本很高。
- 容易踩坑：国产模型兼容 OpenAI 格式不代表所有特性都和 OpenAI 一样。
- 是否建议重新手写：建议手写一遍伪代码对比，不需要真实请求。
- 最小复现步骤：
  1. 写出 OpenAI `messages` 格式。
  2. 写出 Anthropic 独立 `system` 字段格式。
  3. 写出 Gemini `contents` / `system_instruction` 格式。
  4. 再对比 LangChain `model.invoke(messages)` 的统一形态。

```js
// OpenAI-compatible
{
  model: "gpt-3.5-turbo",
  messages: [
    { role: "system", content: "你是代码助手" },
    { role: "user", content: "你好" },
  ],
}

// Anthropic
{
  model: "claude-4.5-opus",
  system: "你是一个代码助手",
  messages: [
    { role: "user", content: [{ type: "text", text: "分析这段代码" }] },
  ],
}

// Gemini
{
  contents: [{ role: "user", parts: [{ text: "解释下这段代码" }] }],
  system_instruction: { parts: [{ text: "你是一个代码专家" }] },
}
```

## 代码片段：ChatModel 初始化

- 来源：docx `image-002`、`image-003`、`image-004`，以及项目 `lessons/_shared/model.mjs`。
- 对应 lesson：`01_tool-test`、所有调用模型的 lesson。
- 代码目的：用具体 ChatModel 类初始化模型。
- 关键 API：`ChatOpenAI`、`ChatGoogleGenerativeAI`、`ChatDeepSeek`、`ChatAnthropic`。
- 输入是什么：API Key、模型名、baseURL、temperature。
- 输出是什么：可调用的 ChatModel 实例。
- 这段代码解决的问题：把厂商模型接入 LangChain 的统一接口。
- 容易踩坑：专用模型包可能不在同一个 npm 包中；OpenAI-compatible 与厂商专用 ChatModel 能力边界不同。
- 是否建议重新手写：建议只手写项目当前使用的 `createChatModel()`，其他厂商初始化看懂即可。
- 最小复现步骤：
  1. 打开 `lessons/_shared/model.mjs`。
  2. 确认 `createChatModel()` 返回 `ChatOpenAI`。
  3. 用任意 lesson 调用 `createChatModel().invoke(...)`。

> 该代码来自截图转写，可能存在识别误差，需要人工核验。

```js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  maxOutputTokens: 2048,
});

const response = await model.invoke(new HumanMessage("Hello world!"));
```

项目当前共享入口的关键形态：

```js
export function createChatModel(options = {}, temperature = 0) {
  return new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
    ...options,
  });
}
```

## 代码片段：ChatPromptTemplate

- 来源：docx `image-007`，项目 `14_prompt-template-test/src/04-chat-prompt-template.mjs`。
- 对应 lesson：`14_prompt-template-test`。
- 代码目的：把 system/human 消息模板化，生成 ChatModel 可用的 messages。
- 关键 API：`ChatPromptTemplate.fromMessages()`、`formatMessages()`。
- 输入是什么：模板变量，如 `tone`、`company_name`、`team_goal`。
- 输出是什么：`SystemMessage` / `HumanMessage` 数组。
- 这段代码解决的问题：让 prompt 角色边界清晰，适合真实 ChatModel 调用。
- 容易踩坑：不要把多轮历史手动拼成一个 human 字符串；历史用 `MessagesPlaceholder`。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 运行 `node --check lessons/14_prompt-template-test/src/04-chat-prompt-template.mjs`。
  2. 打开源码看 `fromMessages` 的数组结构。
  3. 修改 `tone` 或 `team_goal`，观察生成 messages 的差异。

```js
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一名资深工程团队负责人，写作风格要求：{tone}。"],
  ["human", "公司名称：{company_name}\n团队目标：{team_goal}"],
]);

const chatMessages = await chatPrompt.formatMessages({
  tone: "专业、清晰",
  company_name: "星航科技",
  team_goal: "完成内部 AI 助手灰度上线",
});
```

## 代码片段：MessagesPlaceholder

- 来源：docx `image-008`、`image-009`，项目 `14_prompt-template-test/src/07-messages-placeholder-history.mjs`。
- 对应 lesson：`14_prompt-template-test`、`15_runnable-test`、`16_LCEL-chain`。
- 代码目的：在 prompt 中插入历史对话 messages。
- 关键 API：`MessagesPlaceholder`、`formatPromptValue()`。
- 输入是什么：`history` 消息数组、当前问题。
- 输出是什么：包含历史消息的 ChatPromptValue。
- 这段代码解决的问题：让多轮上下文作为 messages 进入模型，而不是手动拼接。
- 容易踩坑：`MessagesPlaceholder` 只负责占位，不负责保存历史。
- 是否建议重新手写：强烈建议。
- 最小复现步骤：
  1. 打开 `07-messages-placeholder-history.mjs`。
  2. 手动增加一轮 history。
  3. 打印 `toChatMessages()`，确认历史位置。

```js
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是工程效率顾问。"],
  new MessagesPlaceholder("history"),
  ["human", "本轮问题：{current_input}"],
]);
```

## 代码片段：PipelinePromptTemplate

- 来源：docx `image-010`、`image-011`，项目 `14_prompt-template-test/src/01-pipeline-prompt-modules.mjs`。
- 对应 lesson：`14_prompt-template-test`。
- 代码目的：把大型 prompt 拆成多个模块再组合。
- 关键 API：`PipelinePromptTemplate`、`PromptTemplate.fromTemplate()`。
- 输入是什么：多个子模板变量和最终模板变量。
- 输出是什么：完整 prompt 字符串。
- 这段代码解决的问题：让 prompt 的人设、背景、任务、格式可复用。
- 容易踩坑：它是 prompt 组合工具，不是通用 chain 编排工具。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 打开 `01-pipeline-prompt-modules.mjs`。
  2. 找到 `pipelinePrompts` 和 `finalPrompt`。
  3. 试着换一个任务模块，复用人设和背景模块。

> 该代码来自截图转写，可能存在识别误差，需要人工核验。

```js
const pipelinePrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    { name: "persona_block", prompt: personaPrompt },
    { name: "context_block", prompt: contextPrompt },
    { name: "task_block", prompt: taskPrompt },
  ],
  finalPrompt,
});
```

## 代码片段：FewShotPromptTemplate

- 来源：docx `image-012`、`image-013`、`image-014`，项目 `14_prompt-template-test/src/08-fewshot-prompt-template.mjs`。
- 对应 lesson：`14_prompt-template-test`。
- 代码目的：把示例、前缀、后缀组合成 few-shot prompt。
- 关键 API：`FewShotPromptTemplate`、`examplePrompt`、`examples`。
- 输入是什么：示例数组、当前用户输入。
- 输出是什么：包含多个示例的完整 prompt。
- 这段代码解决的问题：让模型学习固定结构和表达风格。
- 容易踩坑：示例太多会占上下文；示例质量比数量更重要。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 打开 `08-fewshot-prompt-template.mjs`。
  2. 删除一个示例，观察最终 prompt 变化。
  3. 对比 `09-length-based-example-selector.mjs`。

```js
const fewShotPrompt = new FewShotPromptTemplate({
  examples,
  examplePrompt,
  prefix: "下面是几份周报示例：",
  suffix: "现在请为 {current_request} 写一份周报。",
  inputVariables: ["current_request"],
});
```

## 代码片段：LengthBasedExampleSelector

- 来源：docx `image-016`，项目 `14_prompt-template-test/src/09-length-based-example-selector.mjs`。
- 对应 lesson：`14_prompt-template-test`。
- 代码目的：根据长度预算选择 few-shot 示例。
- 关键 API：`LengthBasedExampleSelector.fromExamples()`。
- 输入是什么：示例数组、最大长度、长度计算函数。
- 输出是什么：符合预算的示例集合。
- 这段代码解决的问题：防止示例过多导致 prompt 超长。
- 容易踩坑：长度选择不等于语义相关，只是预算控制。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 设置较小 `maxLength`。
  2. 观察最终选中的示例数量。
  3. 再调大 `maxLength` 对比。

> 该代码来自截图转写，可能存在识别误差，需要人工核验。

```js
const exampleSelector = await LengthBasedExampleSelector.fromExamples(
  examples,
  { examplePrompt, maxLength: 780, getTextLength: (text) => text.length },
);
```

## 代码片段：SemanticSimilarityExampleSelector

- 来源：docx `image-015`、`image-050`、`image-051`、项目 `14_prompt-template-test/src/11-semantic-example-selector-milvus.mjs`。
- 对应 lesson：`14_prompt-template-test`、`09_milvus-test`。
- 代码目的：根据当前场景语义，从 Milvus 中选择最相关 few-shot 示例。
- 关键 API：`Milvus.fromExistingCollection()`、`SemanticSimilarityExampleSelector`。
- 输入是什么：当前场景描述、向量库连接、`k`。
- 输出是什么：语义最接近的示例。
- 这段代码解决的问题：不同输入场景不应固定使用同一批 few-shot。
- 容易踩坑：依赖 Milvus、embeddings、collection 维度一致；无服务时要看 fallback。
- 是否建议重新手写：建议先手写本地 fallback，再看 Milvus 版。
- 最小复现步骤：
  1. 先运行 `12-local-fallback-example-selector.mjs` 理解链路。
  2. 再准备 Milvus。
  3. 运行 `10-milvus-example-writer.mjs` 写入示例。
  4. 运行 `11-semantic-example-selector-milvus.mjs` 检索示例。

```js
const vectorStore = await Milvus.fromExistingCollection(embeddings, {
  collectionName: COLLECTION_NAME,
  clientConfig: { address: milvusAddress },
  indexCreateOptions: {
    index_type: "IVF_FLAT",
    metric_type: "COSINE",
    params: { nlist: 1024 },
    search_params: { nprobe: 10 },
  },
});

const exampleSelector = new SemanticSimilarityExampleSelector({
  vectorStore,
  k: 2,
});
```

## 代码片段：withStructuredOutput

- 来源：docx `image-021`，项目 `12_output-parser-test/src/05-with-structured-output-or-fallback.mjs`。
- 对应 lesson：`12_output-parser-test`、`13_mini_cursor`。
- 代码目的：用 schema 约束模型输出结构。
- 关键 API：`model.withStructuredOutput(schema)`、`StructuredOutputParser.fromZodSchema()`。
- 输入是什么：自然语言请求、Zod schema。
- 输出是什么：结构化对象。
- 这段代码解决的问题：不用手写普通 JSON prompt，也能获取结构化结果。
- 容易踩坑：不同模型/网关对 response_format 或 tool call 支持不一致，要保留 fallback。
- 是否建议重新手写：强烈建议。
- 最小复现步骤：
  1. 打开 `05-with-structured-output-or-fallback.mjs`。
  2. 先看 `invokeWithStructuredOutput()`。
  3. 再看失败后的 `StructuredOutputParser` fallback。

```js
async function invokeWithStructuredOutput() {
  const structuredModel = model.withStructuredOutput(simpleScientistSchema);
  return structuredModel.invoke("介绍一下爱因斯坦");
}

async function invokeWithParserFallback() {
  const parser = StructuredOutputParser.fromZodSchema(simpleScientistSchema);
  const chain = prompt.pipe(model).pipe(parser);
  return chain.invoke({
    format_instructions: parser.getFormatInstructions(),
  });
}
```

## 代码片段：bindTools

- 来源：docx `image-027`、`image-028`，项目 `01_tool-test/src/tool-file-read.mjs`。
- 对应 lesson：`01_tool-test`。
- 代码目的：定义工具并绑定给模型，让模型能返回 `tool_calls`。
- 关键 API：`tool()`、`z.object()`、`model.bindTools()`。
- 输入是什么：用户请求、工具 name/description/schema。
- 输出是什么：AIMessage，其中可能包含 `tool_calls`。
- 这段代码解决的问题：让模型能把自然语言意图转成工具调用参数。
- 容易踩坑：description 写不清楚时，模型可能不调用工具或参数填错。
- 是否建议重新手写：强烈建议。
- 最小复现步骤：
  1. 读 `tool-file-read.mjs` 中 `readFileTool`。
  2. 确认 `schema` 中 `filePath` 的描述。
  3. 看 `model.bindTools([readFileTool, writeFileTool])`。

```js
const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    return `文件内容:\n${content}`;
  },
  {
    name: "read_file",
    description: "读取文件内容，输入文件路径。",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

const modelWithTools = model.bindTools([readFileTool]);
```

## 代码片段：ToolMessage 循环

- 来源：docx `image-029`、`image-030`、`image-031`，项目 `01_tool-test/src/tool-file-read.mjs`。
- 对应 lesson：`01_tool-test`、`16_LCEL-chain`。
- 代码目的：执行模型请求的工具，并把工具结果写回 messages。
- 关键 API：`AIMessage.tool_calls`、`ToolMessage`、`model.invoke(messages)`。
- 输入是什么：已有 messages、AI 返回的 tool_calls。
- 输出是什么：追加工具结果后的 messages，以及最终 AI 回复。
- 这段代码解决的问题：完成 Agent 的 Reason -> Act -> Observation -> Final Answer 循环。
- 容易踩坑：必须先把含 tool_calls 的 AIMessage 放回 messages，再追加对应 `tool_call_id` 的 ToolMessage。
- 是否建议重新手写：强烈建议，这是 Agent 核心。
- 最小复现步骤：
  1. 准备一个只读文件工具。
  2. 让模型请求读文件。
  3. 执行工具后 push `new ToolMessage(...)`。
  4. 再次 invoke，直到没有 tool_calls。

```js
while (true) {
  const response = await modelWithTools.invoke(messages);

  if (response.tool_calls?.length) {
    messages.push(response);

    for (const toolCall of response.tool_calls) {
      const result = await readFileTool.invoke(toolCall.args);
      messages.push(
        new ToolMessage({
          content: result,
          tool_call_id: toolCall.id,
        }),
      );
    }

    continue;
  }

  console.log(response.content);
  break;
}
```

## 代码片段：JsonOutputToolsParser 解析流式 tool_call_chunks

- 来源：docx `image-024`、`image-025`、`image-026`，项目 `12_output-parser-test/src/09-stream-tool-calls-raw.mjs`、`10-stream-tool-calls-parser.mjs`。
- 对应 lesson：`12_output-parser-test`、`13_mini_cursor`。
- 代码目的：观察 tool call 参数如何在流式输出中逐步成型。
- 关键 API：`modelWithTool.stream()`、`chunk.tool_call_chunks`、`JsonOutputToolsParser`。
- 输入是什么：自然语言请求、工具 schema。
- 输出是什么：原始参数片段或解析后的 args 快照。
- 这段代码解决的问题：mini cursor 这类场景需要边生成边预览工具参数。
- 容易踩坑：中间 chunk 可能不是完整 JSON，不能直接当最终参数执行。
- 是否建议重新手写：建议，尤其适合理解流式结构化输出。
- 最小复现步骤：
  1. 先运行 raw 版本，打印 `tool_call_chunks[].args`。
  2. 再运行 parser 版本，观察 args 对象如何逐步完整。

```js
const parser = new JsonOutputToolsParser();
const chain = modelWithTool.pipe(parser);

const stream = await chain.stream("详细介绍牛顿的生平和成就");

for await (const chunk of stream) {
  if (!chunk.length) continue;
  const toolCall = chunk[0];
  console.log(toolCall.args);
}
```

## 代码片段：memory 示例

- 来源：docx `image-037` 到 `image-041`，项目 `11_memory-test/src/history-test.mjs`。
- 对应 lesson：`11_memory-test`。
- 代码目的：用 ChatMessageHistory 保存多轮消息，并在下一轮调用中带回上下文。
- 关键 API：`InMemoryChatMessageHistory`、`addMessage()`、`getMessages()`。
- 输入是什么：多轮 HumanMessage / AIMessage。
- 输出是什么：包含历史上下文的模型回复。
- 这段代码解决的问题：短期对话中让模型知道前面说过什么。
- 容易踩坑：内存历史不会跨进程持久化；长对话还需要截断/总结/检索。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 第一轮告诉模型一个事实。
  2. 保存用户消息和 AI 回复。
  3. 第二轮只追问“刚才我说了什么”。
  4. 确认历史 messages 被带入。

```js
const history = new InMemoryChatMessageHistory();

await history.addMessage(new HumanMessage("我叫张三"));
const messages1 = [systemMessage, ...(await history.getMessages())];
const response1 = await model.invoke(messages1);
await history.addMessage(response1);

await history.addMessage(new HumanMessage("我叫什么？"));
const messages2 = [systemMessage, ...(await history.getMessages())];
const response2 = await model.invoke(messages2);
```

## 代码片段：RAG 检索示例

- 来源：docx `image-045` 到 `image-049`，项目 `06_rag-test/src/hello-rag.mjs`、`09_milvus-test/src/ebook-reader-rag.mjs`。
- 对应 lesson：`06_rag-test`、`09_milvus-test`。
- 代码目的：检索相关文档片段并注入 prompt，让模型基于片段回答。
- 关键 API：`MemoryVectorStore.fromDocuments()`、`asRetriever()`、`similaritySearchWithScore()`、Milvus `client.search()`。
- 输入是什么：文档、embedding 模型、用户问题。
- 输出是什么：相关片段、相似度、最终回答。
- 这段代码解决的问题：让模型回答私有知识或长文档问题。
- 容易踩坑：相似度分数含义依赖距离类型；Milvus collection 维度必须和 embedding 一致。
- 是否建议重新手写：建议先写内存版，再写 Milvus 版。
- 最小复现步骤：
  1. 运行 `06_rag-test/src/hello-rag.mjs` 理解内存向量库。
  2. 准备 Milvus 后运行 `09_milvus-test/src/query.mjs`。
  3. 再看 `ebook-reader-rag.mjs` 的 context 拼接。

```js
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });
const retrievedDocs = await retriever.invoke(question);

const context = retrievedDocs
  .map((doc, i) => `[片段${i + 1}]\n${doc.pageContent}`)
  .join("\n\n━━━━━\n\n");

const response = await model.invoke(`基于以下片段回答：\n${context}\n\n问题：${question}`);
```

## 代码片段：Milvus similarity search

- 来源：docx `image-043`、`image-044`、`image-046`、项目 `09_milvus-test/src/query.mjs`。
- 对应 lesson：`09_milvus-test`。
- 代码目的：把查询文本向量化后，在 Milvus 中搜索相似记录。
- 关键 API：`MilvusClient.search()`、`MetricType.COSINE`、`output_fields`。
- 输入是什么：query 文本、queryVector、collection name。
- 输出是什么：相似记录和 score。
- 这段代码解决的问题：从持久化向量库中按语义找资料。
- 容易踩坑：docx 中提到余弦相似度，代码里 score 越大/越小的解释要结合 Milvus 返回语义核验。
- 是否建议重新手写：建议在有 Milvus 环境时重写。
- 最小复现步骤：
  1. 确认 `MILVUS_ADDRESS` 或本地 `localhost:19530` 可用。
  2. 确认 collection 已创建和加载。
  3. 调用 `embeddings.embedQuery(query)`。
  4. 调用 `client.search({ metric_type: MetricType.COSINE })`。

```js
const queryVector = await embeddings.embedQuery(query);

const searchResult = await client.search({
  collection_name: COLLECTION_NAME,
  vector: queryVector,
  limit: 2,
  metric_type: MetricType.COSINE,
  output_fields: ["id", "content", "date", "mood", "tags"],
});
```

## 代码片段：Runnable / LCEL 基础链

- 来源：docx `image-053`、`image-054`，项目 `15_runnable-test/src/01-runnable-sequence.mjs`。
- 对应 lesson：`15_runnable-test`、`16_LCEL-chain`。
- 代码目的：把 prompt、model、parser 用 `pipe` 组成顺序 chain。
- 关键 API：`pipe()`、`RunnableSequence`、`invoke()`。
- 输入是什么：包含 prompt 变量和格式说明的对象。
- 输出是什么：parser 解析后的结构化结果。
- 这段代码解决的问题：避免手动写 `format -> invoke -> parse` 的过程式代码。
- 容易踩坑：chain 每个节点的输入输出形态必须对得上。
- 是否建议重新手写：强烈建议。
- 最小复现步骤：
  1. 打开 `15_runnable-test/src/00-before.mjs` 看手写流程。
  2. 再看 `01-runnable-sequence.mjs` 的 `pipe`。
  3. 修改 parser schema，观察输入输出变化。

```js
const chain = promptTemplate.pipe(model).pipe(outputParser);

const result = await chain.invoke({
  text: "LangChain 是一个强大的 AI 应用开发框架",
  format_instructions: outputParser.getFormatInstructions(),
});
```

## 代码片段：RunnableMap

- 来源：docx Runnable API 总结，项目 `15_runnable-test/src/03-runnable-map.mjs`。
- 对应 lesson：`15_runnable-test`。
- 代码目的：同一输入并行经过多个 Runnable，结果按字段汇总。
- 关键 API：`RunnableMap.from()`、`RunnableLambda.from()`。
- 输入是什么：一个对象，如 `{ name, weather, num }`。
- 输出是什么：带多个派生字段的对象。
- 这段代码解决的问题：在 chain 中并行生成多个中间结果。
- 容易踩坑：RunnableMap 是流程级组合，不是 prompt 模块拼接。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 打开 `03-runnable-map.mjs`。
  2. 增加一个新的派生字段。
  3. 观察输出对象。

```js
const runnableMap = RunnableMap.from({
  add: RunnableLambda.from((input) => input.num + 1),
  multiply: RunnableLambda.from((input) => input.num * 2),
  greeting: PromptTemplate.fromTemplate("你好，{name}！"),
});

const result = await runnableMap.invoke({ name: "张三", num: 5 });
```

## 代码片段：LCEL 改造 tool/MCP Agent

- 来源：docx `image-055`、`image-059`，项目 `16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
- 对应 lesson：`16_LCEL-chain`。
- 代码目的：把 tool 调用循环拆成 Runnable 节点并组装成 chain。
- 关键 API：`RunnableSequence`、`RunnableBranch`、`RunnablePassthrough.assign()`、`RunnableLambda`。
- 输入是什么：state：`messages`、`tools`、`done`。
- 输出是什么：更新后的 state，最终回复或下一轮工具消息。
- 这段代码解决的问题：让 Agent 循环从硬编码 while 逻辑变成可组合链路。
- 容易踩坑：state 字段要稳定，否则 branch 和后续节点对不上。
- 是否建议重新手写：建议先理解 `01_tool-test` 的原始循环，再看 LCEL 版本。
- 最小复现步骤：
  1. 读 `01_tool-test/src/tool-file-read.mjs` 的 while 循环。
  2. 再读 `16_LCEL-chain/src/01-case/00-mcp-test.mjs`。
  3. 标出 LLM 节点、toolExecutor 节点、branch 节点。

```js
const agentStepChain = RunnableSequence.from([
  RunnablePassthrough.assign({ response: llmChain }),
  RunnableBranch.from([
    [
      (state) => !state.response.tool_calls?.length,
      new RunnableLambda({ func: async (state) => ({ ...state, done: true }) }),
    ],
    RunnableSequence.from([
      RunnablePassthrough.assign({ toolMessages: toolExecutor }),
      new RunnableLambda({
        func: async (state) => ({
          ...state,
          messages: [...state.messages, ...(state.toolMessages ?? [])],
          done: false,
        }),
      }),
    ]),
  ]),
]);
```

## 代码片段：callbacks 观测 chain

- 来源：docx `image-055`，项目 `16_LCEL-chain/src/02-runnable/03-RunnableWithCallbacks.mjs`。
- 对应 lesson：`16_LCEL-chain`。
- 代码目的：不改业务节点逻辑，给 chain 增加开始、结束、错误日志。
- 关键 API：`callbacks`、`handleChainStart`、`handleChainEnd`、`handleChainError`。
- 输入是什么：Runnable 调用输入和 callbacks 配置。
- 输出是什么：业务结果，以及每个节点的观察日志。
- 这段代码解决的问题：调试、日志、监控、后续 LangSmith 链路观察。
- 容易踩坑：callbacks 是观测增强，不应该承担业务转换逻辑。
- 是否建议重新手写：建议。
- 最小复现步骤：
  1. 运行 `03-RunnableWithCallbacks.mjs`。
  2. 给 `tokenize` 故意制造错误。
  3. 观察 `handleChainError`。

```js
const result = await chain.invoke("hello world from langchain", {
  callbacks: [
    {
      handleChainStart(chainInfo) {
        console.log("[START]", chainInfo.id);
      },
      handleChainEnd(output) {
        console.log("[END]", output);
      },
    },
  ],
});
```

## 需要人工核验的代码点

- docx 里部分截图来自 npm 页面或编辑器截图，代码转写只保留 API 形态，不能保证逐字准确。
- `12_output-parser-test` 没有 README；`13_mini_cursor/README.md` 中包含 structured output 和 mini cursor 说明，lesson 边界需人工确认。
- `14_prompt-template-test/src/04-chat-prompt-template.mjs` 等文件存在 `from'@langchain...` 这种格式问题，属于既有源码状态；本次按要求只读不改。
- `lessons/_shared/model.mjs` 注释在终端显示乱码，但导出 API 可读；是否需要单独修复编码，待人工确认。
