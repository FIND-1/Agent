# Output Parser 实战（MySQL + 流式进阶）

## 🎯 本章目标
掌握：LLM结构化输出 → 数据消费链路（DB / JSON / API）

---

## 🧠 核心链路

LLM
 → withStructuredOutput
 → Zod Schema
 → Structured JSON
 → Data Sink（MySQL / JSON / SQLite）

---

## ⚠️ 本章重点不是 MySQL

MySQL 只是：
👉 结构化数据的一个落地点

---

## 🟡 TODO（重要）

### 数据落地层优化
- [ ] JSON 文件存储（推荐默认）
- [ ] SQLite（轻量数据库）
- [ ] MySQL（仅用于验证）

### 扩展方向
- [ ] 接入 REST API
- [ ] 接入向量数据库
- [ ] 支持 batch ingestion

---

## 📌 复习重点

- withStructuredOutput 如何约束输出
- Zod schema 如何定义结构
- structured output → 数据流转

---

## Workspace 依赖约定

当前项目使用 pnpm workspace，lesson 目录默认复用根目录的 `node_modules` 和根目录 `package.json` 中声明的 Node 包。

新增通用依赖时，优先安装到 workspace 根目录：

```powershell
cd D:\1project\agent
pnpm add -w <package-name>
```

例如：

```powershell
pnpm add -w @zilliz/milvus2-sdk-node
```

只有当某个 lesson 明确需要独立依赖版本时，才安装到对应 lesson 的 `package.json`。
