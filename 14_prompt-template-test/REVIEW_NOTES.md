# REVIEW_NOTES

## 本次整理范围

这轮只做小修，不推倒重来，目标是让 `14_prompt-template-test` 更符合公众号学习代码包规范：

- 修复从文章复制代码时产生的明显运行错误。
- 保持 `00` 到 `13` 的学习顺序。
- 抽离重复模型初始化，避免每个示例都重复大段环境变量配置。
- 补全 README 中的运行顺序、常见报错和 fallback 说明。
- 保留每个示例文件顶部的复习型注释。

## 运行性修复

- `src/10-milvus-example-writer.mjs`
  - `return0` 修复为 `return 0`。
  - `awaitPromise.all` 修复为 `await Promise.all`。
- `src/11-semantic-example-selector-milvus.mjs`
  - 清理过不可见空格，避免复制文章代码后出现难定位的语法问题。
- 所有 `src/*.mjs` 均通过 `node --check` 语法检查。

## 结构调整

- 新增 `src/_shared/model.mjs`。
- 将重复的 `ChatOpenAI` 初始化抽成 `createChatModel()`。
- 将重复的 `OpenAIEmbeddings` 初始化抽成 `createEmbeddings()`。
- 新增 `src/_shared/weeklyPromptBlocks.mjs`，集中保存跨示例复用的周报 prompt blocks。
- `02`、`03`、`06` 不再 import `01`，避免编号示例之间产生隐式运行依赖。
- 没有抽离所有 prompt 文本和示例数据，因为这些内容正是本章要复习的主线。

## 文件顺序

当前顺序保留文章递进关系：

```text
00-basic-prompt-template.mjs
01-pipeline-prompt-modules.mjs
02-pipeline-reuse-okr-review.mjs
03-partial-fixed-context.mjs
04-chat-prompt-template.mjs
05-chat-message-template-classes.mjs
06-pipeline-chat-prompt-template.mjs
07-messages-placeholder-history.mjs
08-fewshot-prompt-template.mjs
09-length-based-example-selector.mjs
10-milvus-example-writer.mjs
11-semantic-example-selector-milvus.mjs
12-local-fallback-example-selector.mjs
13-fewshot-chat-message-prompt.mjs
```

## Milvus fallback

Milvus 相关示例依赖本地或远程 Milvus 服务，复习时很容易被环境阻塞。

因此保留 `src/12-local-fallback-example-selector.mjs` 作为必须可运行的降级示例：

- 不依赖 Milvus。
- 不依赖 embeddings。
- 演示“选择示例 -> 组装 few-shot prompt”的完整链路。
- 只作为学习 fallback，不代表生产级语义检索效果。

## 后续注意

- 如果后续要真实运行 `10` / `11`，需要先准备 Milvus 服务和可用 embeddings 配置。
- 如果模型 SDK 参数变化，优先检查 `src/_shared/model.mjs`。
- 不建议继续把示例数据、prompt 文本大规模抽离，否则会降低打开单个文件复习时的可读性。
