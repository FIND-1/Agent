# AGUI Frontend

React 前端通过 `useChat` 消费 Data Stream Protocol，并分别渲染流式 Markdown、联网搜索和邮件工具状态。

从仓库根目录运行：

```powershell
npm --prefix lessons/22_vercel-test run frontend:build
npm --prefix lessons/22_vercel-test run frontend:lint
npm --prefix lessons/22_vercel-test run frontend:start
```

默认后端为 `http://localhost:3000`；部署时设置 `VITE_API_BASE_URL`。完整说明见课程根 [README](../README.md) 与 [REVIEW_NOTES](../REVIEW_NOTES.md)。
