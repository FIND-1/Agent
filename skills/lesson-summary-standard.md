# Lesson 整理标准

## 来源标准

当前项目整理 `lessons/*` 学习代码包时，默认以 `lessons/14_prompt-template-test` 的组织方式作为标准模板。

该标准适用于：

- 根据公众号文章、`SUMMARY_RULES.txt`、`SUMMARY_RULES.md` 或其他资料整理 lesson。
- 重排 lesson 示例文件顺序。
- 补充 README、REVIEW_NOTES、运行说明和复习重点。
- 修复从文章复制代码后出现的明显语法错误、乱码或示例截断。

## 强制结构

每个整理后的 lesson 推荐包含：

```text
lesson-name/
  package.json
  README.md
  REVIEW_NOTES.md
  src/
    _shared/
      lesson-specific-blocks.mjs
    00-xxx.mjs
    01-xxx.mjs
    02-xxx.mjs
```

模型初始化统一直接从 `@lessons/shared/model` 导入。根目录共享包已经提供 `createChatModel`、`createEmbeddings` 等模型能力，后续不建议、也不应再为单个 lesson 创建只做转发的 `src/_shared/model.mjs`，这会浪费阅读路径并降低可读性。`src/_shared/` 只放当前 lesson 专属的 prompt blocks、schema、样例数据或其他确有复用价值的内容。

## README 标准

README 默认使用 `lessons/14_prompt-template-test/README.md` 的 9 节结构：

1. `为什么需要 ...`
2. `核心学习路径`
3. `API 速查`
4. `概念关系`
5. `安装与环境变量`
6. `运行示例`
7. `常见报错`
8. `当前项目注意事项`
9. `复习重点`

要求：

- 第 2 节必须按编号文件顺序列出每个示例的学习目标。
- 第 3 节用表格总结 API、解决的问题和典型文件。
- 第 6 节必须包含完整 `node --check` 顺序。
- 调用模型、数据库、Milvus、外部服务的示例必须在运行说明中明确标注依赖，并说明环境变量统一来自项目根目录 `.env`。
- 不依赖外部服务的本地复习示例要单独列出，保证根目录 `.env` 不可用时仍可复习。

## REVIEW_NOTES 标准

整理 lesson 后应新增或更新 `REVIEW_NOTES.md`，至少包含：

- 本次整理范围。
- 结构调整。
- 兼容说明或版本差异。
- 文件顺序。
- 后续注意。

如果文章中的 API 与当前安装依赖不一致，必须在 `REVIEW_NOTES.md` 和 README 中说明兼容处理方式。

## 示例文件标准

每个 `src/*.mjs` 示例文件必须：

- 使用两位数编号前缀，例如 `00-`、`01-`、`02-`。
- 按文章或知识递进顺序排序。
- 顶部保留“复习重点”注释，说明当前示例解决的问题和相对前序示例的增量。
- 编号示例之间不要互相 import，避免运行一个示例时触发另一个示例的顶层代码。
- 模型初始化统一使用 `@lessons/shared/model`；不要创建只做 `export ... from "@lessons/shared/model"` 的 lesson 内 `_shared/model.mjs`。prompt blocks、schema 或样例数据等 lesson 专属共享内容可以放入 `src/_shared/`。
- 不要为了抽象而过度拆分示例主线；打开单个编号文件时仍应能看懂当前知识点。

## package.json 标准

对齐 `lessons/14_prompt-template-test`：

- `description` 用中文说明本 lesson 掌握目标。
- `scripts` 保持简洁，默认可只保留：

```json
{
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

- 不强制把所有运行命令写成 npm scripts；完整复习顺序放在 README。
- 不为整理 lesson 污染根项目 `package.json`。

## 文件删除与重排规则

- 未经用户明确允许，不得删除项目文件。
- 给 lesson 示例补编号时，默认保留原文件或兼容路径。
- 当用户明确允许“重新排序后的旧文件可以删除”，并且编号版本已经存在时，可以删除旧的未编号重复文件。
- 删除旧文件前后必须确认：
  - 编号文件存在。
  - README 学习顺序已同步。
  - package.json 脚本路径未指向旧文件。
  - `node --check` 通过。

## 验证标准

整理完成后至少执行：

```bash
node --check src/00-xxx.mjs
node --check src/01-xxx.mjs
```

并根据 lesson 实际文件补齐所有编号示例的 `node --check`。

对于不依赖模型或外部服务的本地示例，应尽量实际运行。对于会调用模型、数据库、Milvus 或外部服务的示例，可以只做语法检查，并在最终说明中明确未运行原因。
