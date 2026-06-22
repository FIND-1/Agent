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

## 📂 文件顺序

1. `src/test/00-create-table.mjs`
   初始化 MySQL 表，只是为了给结构化数据提供一个落地点。
2. `src/test/01-smart-import-with-structured-output.mjs`
   用 `withStructuredOutput + Zod` 从自然语言中提取好友数组，再批量写入数据库。
3. `src/02-structured-json-schema.mjs`
   补充理解 `withStructuredOutput` 底层可能使用的 JSON Schema 机制。
4. `src/test/03-all-tools.mjs`
   mini cursor 的工具集合：读文件、写文件、执行命令、列目录。
5. `src/test/04-stream-mini-cursor.mjs`
   流式版 mini cursor：`AIMessageChunk.concat` + `JsonOutputToolsParser` 解析 `tool_call_chunks`。

## 🟡 TODO（重要）

### 数据落地层优化
- [ ] JSON 文件存储（推荐默认）
- [ ] SQLite（轻量数据库）
- [ ] MySQL（仅用于验证）

### 扩展方向
- [ ] 接入 REST API
- [ ] 接入向量数据库
- [ ] 支持 batch ingestion

### mini cursor 使用 TODO
- [ ] 补一个轻量 demo，只写入临时文件，用来观察 `write_file` 参数流式打印
- [ ] 将生成项目的目录固定到 `_playground`
- [ ] 给 `execute_command` 增加命令白名单，避免复习时执行危险命令
- [ ] 补充一次非流式版和流式版的对比说明

---

## 📌 复习重点

- withStructuredOutput 如何约束输出
- Zod schema 如何定义结构
- structured output → 数据流转
- AIMessageChunk 为什么需要 concat
- JsonOutputToolsParser 如何把 tool_call_chunks 解析成可预览参数
- 流式预览和最终工具执行为什么要分开
