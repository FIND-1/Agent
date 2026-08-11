# 24 Advanced RAG 整理与复习记录

## 1. 本次整理范围

本次以用户提供的 Agentic RAG 公众号原稿为知识来源，以仓库 `SUMMARY_RULES.md` 为整理规范，仅整理 `lessons/24_advanced-rag`，并同步 workspace 锁文件。

原始代码包含四个文章案例，但存在乱码、语法破坏、无编号排序、重复初始化/Schema/Prompt、缺少复习文档和缺少无外部服务 fallback 等问题。

## 2. 文章主线与代码对应

| 原稿阶段            | 整理后文件                  | 要解决的问题                     |
| ------------------- | --------------------------- | -------------------------------- |
| 传统 RAG            | `00-naive-rag.mjs`          | 建立固定“检索 → 生成”对照组      |
| 问题路由            | `01-query-router-rag.mjs`   | 简单问题不必检索                 |
| 多跳检索            | `02-multihop-rag.mjs`       | 单次检索无法覆盖链式问题         |
| 评估与联网补充      | `03-web-fallback-rag.mjs`   | 本地知识不足时避免编造           |
| 规范要求的 fallback | `04-local-fallback-rag.mjs` | 外部服务不可用时仍能复习核心链路 |

文章核心结论：Agentic RAG 不是某一个固定框架，而是让模型参与检索策略、证据评估、查询拆解和数据源选择。实际业务可采用受限的 Plan-and-Execute，通过预定义 workflow 获得更强的控制性。

## 3. 命名与排序调整

原文件按字母排序时无法体现文章顺序。本次增加两位编号，并让文件名直接表达目的：

- `naive-rag.mjs` → `00-naive-rag.mjs`
- `rag-query-router.mjs` → `01-query-router-rag.mjs`
- `rag-multihop.mjs` → `02-multihop-rag.mjs`
- `rag-webfallback.mjs` → `03-web-fallback-rag.mjs`
- 新增 `04-local-fallback-rag.mjs`

编号只改变学习入口，不改变文章四个原始案例的递进关系。

## 4. `_shared/` 抽离结果

公共目录包含：

- `runtime.mjs`：根目录 `.env` 加载、模型和 embedding 初始化、Milvus 延迟连接、过滤、文档去重及输出工具。
- `schemas.mjs`：路由、问题拆解、下一步规划和资料评估 Schema。
- `prompts.mjs`：跨示例重复的直接回答和证据约束 Prompt。

抽离后，各编号示例仍保留 GraphState、节点、条件边和当前案例专属 Prompt，打开单个文件仍能看清该案例的图结构。没有把示例主体隐藏进公共模块。

## 5. 为降低复习成本所做的结构调整

- 所有示例支持命令行传入问题。
- 每个核心文件顶部说明当前问题、相对前例新增能力、适用 API、局限和外部依赖。
- Milvus 改为延迟连接，路由后的 simple 分支不会提前连接向量库。
- Milvus 检索固定过滤新书 `book_id`，与 lesson 09 的《哈利波特与魔法石》数据一致。
- 多跳结果按稳定 `id` 去重，并设置最大检索轮数。
- Web 回退最多联网一次，避免无限回边。
- 编号示例可被测试代码安全导入，但不会在 import 时执行 `main`。

## 6. 依赖分类

### 无需 API Key 和外部服务

- `04-local-fallback-rag.mjs`

### 需要模型 API

- `01-query-router-rag.mjs` 的路由和 simple 分支。

### 需要模型 API、embedding API 和 Milvus

- `00-naive-rag.mjs`
- `01-query-router-rag.mjs` 的 complex 分支
- `02-multihop-rag.mjs`
- `03-web-fallback-rag.mjs` 的本地检索阶段

### 还需要 Web API

- `03-web-fallback-rag.mjs` 在本地证据不足时需要 `BOCHA_API_KEY` 和网络。

## 7. 外部服务验证边界

项目没有 Milvus Docker 编排，服务和端口由用户管理。本轮没有启动或接管任何本地服务，也没有宣称模型、Milvus 或博查的端到端链路运行通过。

已完成的验证是：语法检查、模块 import、LangGraph 编译、纯本地 fallback 执行、目录结构和依赖检查。

## 8. fallback 路径

`04-local-fallback-rag.mjs` 内置少量摘要片段，使用关键词命中代替向量检索，使用规则代替模型路由与评估，最后打印组装完成的 Prompt。

该实现的价值是保留以下主线：

```text
问题 -> 路由 -> 选择资料 -> 评估 -> 组装上下文 -> Prompt
```

它不用于比较真实检索质量，也不模拟 LLM 的最终自然语言生成。

## 9. 后续复习坑点

- `withStructuredOutput` 提高控制流稳定性，但模型仍可能给出语义上不理想的判断。
- 多跳 RAG 必须同时设置模型停止判断和代码硬上限。
- 向量检索适合语义相似度，不擅长所有精确实体；完整 Hybrid RAG 还可加入全文检索、SQL、rerank 和查询改写。
- Web 搜索结果并不天然可信，生产环境还需来源评级、去重、时效性和引用校验。
- 本例的共享 collection 会被后续 lesson 复用，修改数据主题时必须同步检索 Prompt 和 `book_id`。

## 10. 交付自检记录

- `_shared/`：非空，包含 runtime、schemas、prompts。
- Markdown：课程根目录仅有 `README.md` 和 `REVIEW_NOTES.md`。
- 子目录 `node_modules`：不应存在；依赖复用仓库根目录。
- 编号示例互相 import：无；只 import `_shared/`。
- 重复初始化：模型、embedding、环境读取只在 `runtime.mjs`。
- 重复 Schema/Prompt：跨示例重复项已抽离。
- package：已提供检查和五个 demo 命令。
- 环境变量：README 明确来自仓库根目录 `.env`。
- fallback：已提供无需 API Key、Milvus 和网络的 04 示例。
- 外部服务：只记录为运行前置条件，未声称端到端验证。
