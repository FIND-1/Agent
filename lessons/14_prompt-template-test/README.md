# Prompt Template：组件化管理 Prompt

本项目对应 `14.txt` 中的 Prompt Template 博文，核心目标不是讨论“prompt 应该怎么写”，而是学习如何在工程里管理 prompt：把角色、背景、任务、格式、示例等拆成可维护的模块，再按场景组合成最终发送给模型的 prompt 或 messages。

## 1. 为什么需要 Prompt Template

直接把 prompt 写成字符串，在 demo 阶段够用，但随着场景变多会出现几个问题：

- 不同业务场景会重复使用相同的角色、背景、输出格式。
- prompt 越长，越难定位某一段规则应该在哪里维护。
- few-shot 示例会越来越多，需要按长度、语义或业务场景动态选择。
- Chat 模型通常接收 `system` / `human` / `ai` 等 messages，而不是单个字符串。

LangChain 的 Prompt Template API 主要解决这些管理问题：变量填充、模块复用、对话消息组织、示例拼装和示例选择。

## 2. 核心学习路径

建议按下面顺序阅读和运行源码：

0. `src/_shared/model.mjs`
   - 抽离 `ChatOpenAI` 和 `OpenAIEmbeddings` 的初始化。
   - 这部分不是 Prompt Template 主线，抽出来是为了让每个示例更聚焦。
   - 如果模型服务地址、模型名或 embeddings 参数变化，优先改这里。

0.1. `src/_shared/weeklyPromptBlocks.mjs`
   - 抽离周报场景可复用的 `personaPrompt`、`contextPrompt` 和 `pipelinePrompt`。
   - 编号示例文件通过它复用 prompt blocks，不直接 import 其他编号文件。
   - 这能避免运行一个示例时触发另一个编号示例的顶层代码。

1. `src/00-basic-prompt-template.mjs`
   - 使用 `PromptTemplate.fromTemplate()` 定义带占位符的字符串模板。
   - 通过 `format()` 填入 `company_name`、`team_name`、`dev_activities` 等变量。
   - 适合理解“模板 + 变量 = 最终 prompt”的基础模型。

2. `src/01-pipeline-prompt-modules.mjs`
   - 使用 `PipelinePromptTemplate` 把 prompt 拆成多个模块：人设、背景、任务、格式。
   - 最终通过 `finalPrompt` 把多个子模板组合成完整周报 prompt。
   - 重点理解：大型 prompt 不应该都堆在一个字符串里，应该拆成可维护、可复用的组件。

3. `src/02-pipeline-reuse-okr-review.mjs`
   - 复用 `src/_shared/weeklyPromptBlocks.mjs` 里的 `personaPrompt` 和 `contextPrompt`。
   - 换成“季度 OKR 回顾邮件”的任务模块和格式模块。
   - 重点理解：相同的人设与业务背景可以复用到不同输出场景，但编号示例之间不互相 import。

4. `src/03-partial-fixed-context.mjs`
   - 使用 `partial()` 预填固定变量，例如公司名、价值观、默认语气。
   - 生成新的模板后，调用时只需要补充剩余变量。
   - 适合处理“项目级固定上下文 + 每次运行动态输入”的场景。

5. `src/04-chat-prompt-template.mjs`
   - 使用 `ChatPromptTemplate.fromMessages()` 组织 `system` 和 `human` 消息。
   - 通过 `formatMessages()` 生成 Chat 模型可直接消费的 messages 数组。
   - 重点理解：实际 Chat 模型调用中，messages 形式通常比单字符串 prompt 更常用。

6. `src/05-chat-message-template-classes.mjs`
   - 使用 `SystemMessagePromptTemplate` / `HumanMessagePromptTemplate` 组合消息模板。
   - 适合对比数组写法和显式消息模板类写法。

7. `src/06-pipeline-chat-prompt-template.mjs`
   - 将 `PipelinePromptTemplate` 和 `ChatPromptTemplate` 结合。
   - 子模板仍然负责生成可复用信息块，最终模板则输出 messages。
   - 这是更贴近真实项目的组织方式：内部按模块拼 prompt，外部以 chat messages 调用模型。

8. `src/07-messages-placeholder-history.mjs`
   - 使用 `MessagesPlaceholder` 在 prompt 中插入历史对话。
   - 适合多轮对话、上下文追问、聊天 Agent 等场景。

9. `src/08-fewshot-prompt-template.mjs`
   - 使用 `FewShotPromptTemplate` 手动提供 few-shot 示例。
   - 示例由 `examplePrompt` 渲染，再与 `prefix` / `suffix` 拼成最终 prompt。
   - 重点理解：few-shot 的价值是稳定输出风格、结构和粒度。

10. `src/09-length-based-example-selector.mjs`
    - 使用 `LengthBasedExampleSelector` 根据长度预算自动挑选示例。
    - 适合控制 prompt 总长度，避免示例过多导致上下文膨胀。

11. `src/10-milvus-example-writer.mjs`
    - 使用 `@zilliz/milvus2-sdk-node` 将周报示例写入 Milvus。
    - 每条示例包含 `scenario`、`report_snippet` 和向量字段。
    - 这是语义选择示例前的数据准备脚本。

12. `src/11-semantic-example-selector-milvus.mjs`
    - 使用 `SemanticSimilarityExampleSelector` 从 Milvus 中选择语义最相近的 few-shot 示例。
    - 使用 `@langchain/community/vectorstores/milvus` 连接已有集合。
    - 重点理解：不同输入场景应该匹配不同示例，而不是固定塞同一批 few-shot。

13. `src/12-local-fallback-example-selector.mjs`
    - 在没有 Milvus / embeddings 服务时，用本地文本相似度选择 few-shot 示例。
    - 这不是向量检索的等价替代，但能保证复习和演示链路不被外部服务阻塞。
    - 重点理解：生产环境优先语义检索，本地学习必须准备可运行 fallback。

14. `src/13-fewshot-chat-message-prompt.mjs`
    - 使用 `FewShotChatMessagePromptTemplate` 组织对话形式的 few-shot。
    - 每条示例是 `human -> ai` 的消息片段，而不是普通字符串。
    - 适合 Chat 模型下的 few-shot 学习。

## 3. API 速查

| API | 解决的问题 | 典型文件 |
| --- | --- | --- |
| `PromptTemplate` | 字符串模板变量填充 | `00-basic-prompt-template.mjs` |
| `PipelinePromptTemplate` | 多个 prompt 模块组合与复用 | `01-pipeline-prompt-modules.mjs` / `02-pipeline-reuse-okr-review.mjs` / `06-pipeline-chat-prompt-template.mjs` |
| `partial()` | 预填固定变量，减少重复传参 | `03-partial-fixed-context.mjs` |
| `ChatPromptTemplate` | 生成 Chat 模型需要的 messages 数组 | `04-chat-prompt-template.mjs` / `05-chat-message-template-classes.mjs` |
| `MessagesPlaceholder` | 在模板中插入历史消息 | `07-messages-placeholder-history.mjs` |
| `FewShotPromptTemplate` | 在普通 prompt 中拼接 few-shot 示例 | `08-fewshot-prompt-template.mjs` |
| `FewShotChatMessagePromptTemplate` | 在 Chat messages 中拼接 few-shot 对话示例 | `13-fewshot-chat-message-prompt.mjs` |
| `LengthBasedExampleSelector` | 根据长度预算选择示例 | `09-length-based-example-selector.mjs` |
| `SemanticSimilarityExampleSelector` | 根据语义相似度选择示例 | `11-semantic-example-selector-milvus.mjs` |
| 本地 fallback selector | 无 Milvus 时用轻量文本相似度选择示例 | `12-local-fallback-example-selector.mjs` |

## 4. 概念关系

```text
原始输入
  -> PromptTemplate 填充变量
  -> PipelinePromptTemplate 组合模块
  -> ChatPromptTemplate 转成 messages
  -> FewShot / ExampleSelector 注入合适示例
  -> 无 Milvus 时使用本地 fallback 保持链路可复习
  -> LLM 生成结果
```

可以把它理解为三层：

- 基础层：`PromptTemplate` 和 `ChatPromptTemplate`，负责把变量渲染成字符串或 messages。
- 组合层：`PipelinePromptTemplate` 和 `partial()`，负责复用公共模块、预填固定上下文。
- 示例层：`FewShotPromptTemplate`、`FewShotChatMessagePromptTemplate` 和 `ExampleSelector`，负责管理示例和动态选择示例。
- 降级层：`12-local-fallback-example-selector.mjs`，负责在没有 Milvus 服务时保留可运行的示例选择链路。

## 5. 安装与环境变量

安装依赖：

```bash
pnpm install
```

`.env` 需要提供：

```bash
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
EMBEDDINGS_MODEL_NAME=text-embedding-v3
MILVUS_ADDRESS=localhost:19530
MILVUS_COLLECTION_NAME=weekly_report_examples
```

`MILVUS_ADDRESS` 和 `MILVUS_COLLECTION_NAME` 只在 Milvus 相关脚本中需要。

## 6. 运行示例

完整复习顺序：

```bash
node src/12-local-fallback-example-selector.mjs
node --check src/00-basic-prompt-template.mjs
node --check src/01-pipeline-prompt-modules.mjs
node --check src/02-pipeline-reuse-okr-review.mjs
node --check src/03-partial-fixed-context.mjs
node --check src/04-chat-prompt-template.mjs
node --check src/05-chat-message-template-classes.mjs
node --check src/06-pipeline-chat-prompt-template.mjs
node --check src/07-messages-placeholder-history.mjs
node --check src/08-fewshot-prompt-template.mjs
node --check src/09-length-based-example-selector.mjs
node --check src/10-milvus-example-writer.mjs
node --check src/11-semantic-example-selector-milvus.mjs
node --check src/12-local-fallback-example-selector.mjs
node --check src/13-fewshot-chat-message-prompt.mjs
```

`node --check` 只做语法检查，不会调用模型，也不会连接 Milvus。真正运行调用模型的脚本前，请先确认 `.env` 可用。

基础模板：

```bash
node src/00-basic-prompt-template.mjs
```

管道模板：

```bash
node src/01-pipeline-prompt-modules.mjs
node src/02-pipeline-reuse-okr-review.mjs
node src/06-pipeline-chat-prompt-template.mjs
```

Chat 模板：

```bash
node src/04-chat-prompt-template.mjs
node src/05-chat-message-template-classes.mjs
node src/07-messages-placeholder-history.mjs
```

Few-shot 与示例选择：

```bash
node src/08-fewshot-prompt-template.mjs
node src/09-length-based-example-selector.mjs
node src/13-fewshot-chat-message-prompt.mjs
```

Milvus 语义示例选择：

```bash
node src/10-milvus-example-writer.mjs
node src/11-semantic-example-selector-milvus.mjs
```

注意：Milvus 相关脚本要求本地或远程已有可连接的 Milvus 服务。没有启动 Milvus 时，连接 `localhost:19530` 会失败。

无 Milvus fallback：

```bash
node src/12-local-fallback-example-selector.mjs
```

fallback 是本项目必须保留的复习示例：当 Milvus、Docker 或远程向量库不可用时，仍然可以观察“选择示例 -> 组装 few-shot prompt”的完整流程。

## 7. 常见报错

- `ECONNREFUSED 127.0.0.1:19530`：Milvus 没有启动，先跳过 `10` / `11`，运行 `12-local-fallback-example-selector.mjs` 复习降级链路。
- `OPENAI_API_KEY` 相关错误：`.env` 未配置或 Key 不可用。可以先跑 `node --check` 和 fallback 示例。
- embeddings 维度不一致：`VECTOR_DIM` 需要和 `EMBEDDINGS_MODEL_NAME` 实际输出维度保持一致，本项目按 `text-embedding-v3` 的 `1024` 维示例整理。

## 8. 当前项目注意事项

- 当前示例统一围绕“技术周报 / OKR 回顾”展开，便于观察不同模板 API 的差异。
- `src/_shared/model.mjs` 只抽离模型和 embeddings 初始化，不抽 prompt 逻辑，避免学习示例被过度封装。
- `src/_shared/weeklyPromptBlocks.mjs` 只放跨示例复用的周报 prompt blocks，编号示例之间禁止互相 import。
- `09-length-based-example-selector.mjs` 是长度选择示例，不依赖向量数据库。
- `11-semantic-example-selector-milvus.mjs` 是语义相似度选择示例，依赖 Milvus 和 embeddings。
- `12-local-fallback-example-selector.mjs` 是必须保留的 fallback 示例，用于无 Milvus 环境下复习示例选择链路。
- 如果本地不方便启动 Milvus，可以先跳过 `10-milvus-example-writer.mjs` 和 `11-semantic-example-selector-milvus.mjs`，但需要运行 `12-local-fallback-example-selector.mjs` 理解降级思路。
- 后续可以把 Milvus 换成更轻量的向量后端，例如 SQLite 向量扩展、本地 HNSW 或托管向量数据库。

## 9. 复习重点

- `PromptTemplate` 解决变量填充，`ChatPromptTemplate` 解决 messages 组织。
- `PipelinePromptTemplate` 的价值在于拆分和复用，不只是“把字符串拼起来”。
- `partial()` 适合沉淀固定上下文，减少每次调用时的重复参数。
- Few-shot 示例应当学习结构和表达方式，而不是照搬具体内容。
- `LengthBasedExampleSelector` 关注长度预算，`SemanticSimilarityExampleSelector` 关注场景匹配。
- Milvus 依赖外部服务，学习项目必须准备 fallback，避免复习链路被环境阻塞。
- 示例文件顶部的“复习重点”注释必须保留，用来说明当前示例解决的问题和相对前序示例的增量。
- 在真实 Agent 或业务应用里，prompt 管理通常会同时用到模块化、messages、few-shot 和动态示例选择。
