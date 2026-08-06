# AGUI Backend

Nest 后端负责 LangChain Agent、`web_search`、`send_mail`，并把 Agent stream 转为 Vercel AI SDK Data Stream Protocol。

从仓库根目录运行：

```powershell
npm --prefix lessons/22_vercel-test run backend:build
npm --prefix lessons/22_vercel-test run backend:test
npm --prefix lessons/22_vercel-test run backend:start
```

配置、调用链和 fallback 见课程根 [README](../README.md) 与 [REVIEW_NOTES](../REVIEW_NOTES.md)。
