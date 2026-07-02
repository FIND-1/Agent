# Lesson 排序与注释保留规则

适用场景：整理 `lessons/*` 学习代码包，尤其是结合 `SUMMARY_RULES.txt`、公众号文章原文、课程代码进行“排序、总结、整理、方便复习”时。

## 强制规则

1. “排序”默认只表示按学习顺序给文件夹和文件编号、调整展示顺序，不等于拍平目录结构。
2. 文件夹和文件都要排序，但编号规则不同：
   - 文件夹从 `01-` 开始。
   - 文件从 `00-` 开始。
3. 文件名必须保留或贴近文档原始文件名语义。格式是：

```text
<文件编号>-<文档原始文件名语义>.mjs
```

4. 不能擅自把原有文件从 `cases/`、`runnables/` 等语义文件夹移动到 `src/` 根目录。
5. 若原项目已有语义文件夹，应保留语义并加编号，例如：

```text
src/
  01-case/
  02-runnable/
```

6. 文件顺序必须优先服从 `SUMMARY_RULES.txt` 或公众号文章中的学习顺序，其次才是工程分类。
7. 原文件已有注释不能删除。整理时只能：
   - 保留原注释；
   - 修正乱码或明显错误；
   - 在原注释基础上补充复习型注释；
   - 移动注释到更合适的位置，但不得丢失原注释表达的信息。
8. 新增复习型注释时，不要替换掉原注释。应补充说明：
   - 当前示例解决什么问题；
   - 对应文章中的哪个知识点；
   - 相比前一个示例新增了什么；
   - 是否依赖 API Key、MCP、Milvus、Docker 或其他外部服务。
9. 如果必须重命名或移动文件，移动前要先说明目标结构；移动后 README 必须同步路径。
10. 未经用户明确允许，不要删除旧文件；如果需要用编号版本替代旧文件，必须确认旧注释和学习信息已完整迁移。

## 命名示例

原文或原代码路径：

```text
src/cases/ebook-reader-rag.mjs
```

整理后应为：

```text
src/01-case/00-ebook-reader-rag.mjs
```

如果用户明确要求简化名称，也可以按文档语义调整为：

```text
src/01-case/00-book-reader-rag.mjs
```

关键点：

- `01-case` 是文件夹编号，从 `01` 开始。
- `00-book-reader-rag.mjs` 是文件编号，从 `00` 开始。
- 文件名主体来自文档或原文件名语义，而不是随意改成另一个工程化名称。

## lessons/16_LCEL-chain 当前应采用的规则

按文章顺序整理时，应优先形成类似结构：

```text
src/
  01-case/
    00-mcp-test.mjs
    01-ebook-reader-rag.mjs
    02-rag-local-fallback-chain.mjs
  02-runnable/
    00-RunnableWithRetry.mjs
    01-RunnableWithFallbacks.mjs
    02-RunnableWithConfig.mjs
    03-RunnableWithCallbacks.mjs
```

其中 fallback 文件是因为 Milvus 属于外部服务依赖，按 `SUMMARY_RULES.txt` 要求补充的 fallback 复习路径。
