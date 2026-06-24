# REVIEW NOTES（复习笔记）

## ✔ 已完成能力

1. LLM 结构化输出（withStructuredOutput）
2. Zod schema 定义结构
3. structured data → 数据消费
4. 流式 mini cursor 工具参数预览
5. AIMessageChunk 拼接为完整 AIMessage
6. JsonOutputToolsParser 解析 tool_call_chunks
7. 按文章推进顺序整理为 `00` 到 `03` 的学习文件

---

## ⚠️ 架构理解重点

MySQL 不属于学习重点，而是：

👉 “数据落地层的一种实现”

---

## 🧠 关键设计思想

LLM 输出 ≠ 最终结果  
LLM 输出 = 中间结构化数据

---

## 🟡 TODO

- JSON 存储（推荐）
- SQLite（轻量）
- MySQL（可选）
- 轻量 mini cursor demo：只写入临时文件，不创建完整 React 项目
- mini cursor 输出目录隔离到 `_playground`
- execute_command 增加更严格的安全限制

---

## ❌ 不推荐

- Docker MySQL（学习成本过高）
- Workbench 依赖教学（无价值）
