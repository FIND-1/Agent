# REVIEW_NOTES

## 本次整理范围

这轮只做小修，不推倒重来，目标是让 `15_runnable-test` 更符合公众号学习代码包规范：

- README 改为 1 到 9 的固定学习结构。
- 保持 `00` 到 `09` 的编号学习顺序。
- 补齐每个示例文件顶部的“复习重点”注释。
- 调用模型的示例统一从 `@lessons/shared/model` 导入 `createChatModel()`；后续不再创建 lesson 内只做转发的 `_shared/model.mjs`，避免降低可读性。
- 保留不依赖模型的本地 Runnable 示例，方便在 `.env` 不可用时复习。

## 结构调整

- `00-before.mjs`：保留旧写法作为对比。
- `01-runnable-sequence.mjs`：展示 `pipe()` 和 `RunnableSequence`。
- `02` 到 `08`：覆盖普通函数、并行、分支、路由、上下文保留、循环和字段选择。
- `09-runnable-with-message-history.mjs`：展示给 chain 添加对话历史。

## 兼容说明

文章中提到的 `RouterRunnable` 在当前安装的 `@langchain/core` 中没有导出。

因此 `05-router-runnable.mjs` 使用 `RunnableLambda + routes` 实现同样的 key 路由效果，保留学习概念，同时避免写出当前依赖版本无法运行的代码。

## 文件顺序

当前顺序保留文章递进关系：

```text
00-before.mjs
01-runnable-sequence.mjs
02-runnable-lambda.mjs
03-runnable-map.mjs
04-runnable-branch.mjs
05-router-runnable.mjs
06-runnable-passthrough.mjs
07-runnable-each.mjs
08-runnable-pick.mjs
09-runnable-with-message-history.mjs
```

## 后续注意

- 调整示例顺序时，必须同步 README 的核心学习路径和运行命令。
- 重新排序后旧的未编号重复文件可以删除，但要确认编号版本已经存在。
- 不建议把所有示例数据都抽到 `_shared`，否则打开单个文件复习时会降低可读性。
