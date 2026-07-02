# REVIEW_NOTES

## 本次整理范围

结合 `SUMMARY_RULES.txt` 文章《实战练习 LCEL 组装 chain》，重新整理 `lessons/16_LCEL-chain`。

## 结构调整

保留语义文件夹，不拍平目录结构：

```text
src/
  01-case/
  02-runnable/
```

文件夹和文件都按文章学习顺序编号。

## 文件顺序

1. `01-case/00-mcp-test.mjs`：MCP + tools agent 的 LCEL 写法。
2. `01-case/01-ebook-reader-rag.mjs`：RAG + Milvus 的 LCEL 写法。
3. `01-case/02-rag-local-fallback-chain.mjs`：Milvus 不可用时的 fallback 复习示例。
4. `02-runnable/00-RunnableWithRetry.mjs`：`withRetry`。
5. `02-runnable/01-RunnableWithFallbacks.mjs`：`withFallbacks`。
6. `02-runnable/02-RunnableWithConfig.mjs`：`withConfig`。
7. `02-runnable/03-RunnableWithCallbacks.mjs`：`callbacks`。

## 注释处理

- 原文注释语义已恢复为中文。
- 没有用新增注释替代原注释；新增的是顶部复习型注释。
- 复习型注释说明当前示例解决的问题、对应知识点、依赖条件和适用场景。

## 依赖分类

- 无需 API Key：`02-rag-local-fallback-chain.mjs`、`00-RunnableWithRetry.mjs`、`01-RunnableWithFallbacks.mjs`、`02-RunnableWithConfig.mjs`、`03-RunnableWithCallbacks.mjs`。
- 需要模型 API：`00-mcp-test.mjs`。
- 需要外部服务：`01-ebook-reader-rag.mjs` 需要 Milvus。

## _shared 抽离结果

本 lesson 暂未新增 `_shared/`。原因：

- 示例之间没有共享 schema、examples 或 prompt block 达到必须抽离的程度。
- 模型初始化已统一使用根项目的 `@lessons/shared/model`。
- 保持单个示例文件打开即可复习，学习价值更高。

## 后续注意

- 不要把 `01-case` 和 `02-runnable` 拍平到 `src/` 根目录。
- 不要删除原注释，只能修正乱码或补充复习注释。
- 如果后续加入 Milvus 初始化脚本，再同步 README 的外部服务运行说明。
- 不要为单个 lesson 新增环境变量示例文件；环境变量统一维护在项目根目录 `.env`，README 只列出当前 lesson 会读取哪些变量。

## 验证结果

已执行并通过：

```powershell
node --check .\src\01-case\00-mcp-test.mjs
node --check .\src\01-case\01-ebook-reader-rag.mjs
node --check .\src\01-case\02-rag-local-fallback-chain.mjs
node --check .\src\02-runnable\00-RunnableWithRetry.mjs
node --check .\src\02-runnable\01-RunnableWithFallbacks.mjs
node --check .\src\02-runnable\02-RunnableWithConfig.mjs
node --check .\src\02-runnable\03-RunnableWithCallbacks.mjs
```

已实际运行无需 API Key 的示例：

```powershell
node .\src\01-case\02-rag-local-fallback-chain.mjs
node .\src\02-runnable\00-RunnableWithRetry.mjs
node .\src\02-runnable\01-RunnableWithFallbacks.mjs
node .\src\02-runnable\02-RunnableWithConfig.mjs
node .\src\02-runnable\03-RunnableWithCallbacks.mjs
```

未实际运行：

- `00-mcp-test.mjs`：需要模型 API、`AMAP_MAPS_API_KEY`，并可能通过 `npx` 启动 `chrome-devtools-mcp`。
- `01-ebook-reader-rag.mjs`：需要模型 API、embedding API 和本地 Milvus。
