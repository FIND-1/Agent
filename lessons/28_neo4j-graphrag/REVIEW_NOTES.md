# Lesson 28 整理与复习记录

> 外部依赖边界：截至 2026 年 8 月 21 日，本轮没有启动 Docker、没有连接 Neo4j、没有执行 Cypher、新建节点或调用模型 API。所有 Neo4j / GraphRAG 运行链路都仍然属于外部前置条件；这次交付的是按文章主线整理后的学习代码包和静态检查结果。

## 文章真正想教会什么

文章不是单纯教 Neo4j 语法，而是想说明为什么传统 RAG 只靠 Milvus 或 ES 还不够。它先从“找得到相似文本，却找不到概念关系”这个痛点切入，再引出知识图谱：

1. 用 Neo4j 存储节点和关系，解决“单点检索”缺少关联链路的问题。
2. 用 Cypher 学会最基础的建图、查图、改图、删图。
3. 用 `neo4j-driver` 把 Cypher 从图形界面迁到代码里。
4. 最后把图查询接到 LangGraph 工作流里，形成最小 GraphRAG。

课程真正的知识主线是：**为什么需要图谱检索，以及图谱检索如何接入 RAG**。

## 文章与代码对应关系

| 原文知识点 | 当前文件 | 说明 |
| --- | --- | --- |
| `docker-compose.yml` 跑 Neo4j | `docker-compose.yml` | 原文配置保留，但只作为外部前置条件 |
| `cypher.md` 创建节点、关系、查询 | `queries/00-cypher.md` | 保留原文件名主体，补 `00-` 排序前缀后移到 `queries/` |
| `cypher2.md` 更新与删除 | `queries/01-cypher2.md` | 保留原文件名主体，补 `01-` 排序前缀后移到 `queries/` |
| `src/neo4j-test.mjs` | `src/02-neo4j-test.mjs` | 原文代码入口，补 `02-` 排序前缀 |
| `src/graphrag.mjs` | `src/03-graphrag.mjs` | 原文最终入口，补 `03-` 排序前缀，并改为复用共享模型入口 |

## 本次整理做了什么

### 1. 目录整理

- 新增 `README.md`，把学习目标、运行方式、依赖分类和降级复习路径补齐。
- 新增 `REVIEW_NOTES.md`，沉淀文章主线、代码对应关系和这次整理原因。
- 新增 `queries/` 子目录，并把原本位于课程根目录的 `cypher.md`、`cypher2.md` 按复习顺序整理为 `00-cypher.md`、`01-cypher2.md`。

这样处理的原因是：

- 满足课程根目录只保留 `README.md` 和 `REVIEW_NOTES.md` 两份 Markdown 的规则。
- 又不破坏原文点名文件名主体，同时把整节课的复习顺序直接体现在文件名里。

### 2. 源码整理

- 将 `src/neo4j-test.mjs`、`src/graphrag.mjs` 分别整理为 `src/02-neo4j-test.mjs`、`src/03-graphrag.mjs`，把排序前缀补回文件名。
- 修复 `src/03-graphrag.mjs` 里的明显富文本粘连问题，例如 `awaitPromise.all`。
- 统一两份 `.mjs` 文件的 import 格式、缩进和顶层执行结构。
- 给 `src/02-neo4j-test.mjs`、`src/03-graphrag.mjs` 都补了复习型注释，说明示例目的、适用场景和依赖边界。
- 在 `src/02-neo4j-test.mjs` 中补上 `session.close()`、`driver.close()`，避免示例执行后资源不释放。
- 更新课程 `package.json`，补上 `check`、`demo:neo4j`、`demo:graphrag` 脚本，保证 README 里的命令和文件一致。
- 新增 `src/_shared/env.mjs`，让 Lesson 28 与 Lesson 27 统一读取根 `.env` 里的 `ESAGENT_*` 变量。
- `src/03-graphrag.mjs` 改为复用仓库级 `@lessons/shared/model` 的 `createChatModel()`，不再单独手写一份 `ChatOpenAI` 初始化。

### 3. 依赖与运行边界说明

- README 明确说明 `src/03-graphrag.mjs` 读取的是项目根 `.env` 中的 `ESAGENT_*`，不是课程目录私有 `.env`，并与 Lesson 27 对齐。
- README 明确说明当前根安装里 `neo4j-driver` 未确认可直接解析，因此“可复习”不等于“我已替你本地跑通”。
- README 明确给出“外部服务不可用时的最小复习路径”，没有额外新增原文没有的 fallback 示例文件。

## `_shared/` 抽离结果

本课补了最小 `_shared/`，但只抽环境变量读取，不再重复造一份 lesson 内模型工厂。检查结论如下：

- 模型初始化：改为复用仓库级 `@lessons/shared/model` 的 `createChatModel()`。
- 环境变量读取：已抽到 `src/_shared/env.mjs`，并与 Lesson 27 的 `readEsAgentEnv()` 约定保持一致。
- schema / examples / prompt block：没有跨多个示例重复出现 2 次及以上。
- 工具函数复用：没有编号示例之间互相 import 的情况。

因此本课不再继续创建只做转发的 `src/_shared/model.mjs`。共享模型能力直接复用仓库级入口，课程内只保留 `ESAGENT_*` 的最小 env 适配。

## 原文与当前代码的差异

1. 用户给的 `D:/360MoveData/Users/uu/Desktop/SUMMARY_RULES.txt` 实际内容是 Neo4j / GraphRAG 文章原文，而不是整理规则本身；本轮整理规则来自项目根 `SUMMARY_RULES.md`，文章原文则作为知识主线输入。
2. 原文代码里存在富文本复制常见问题，最明显的是 `awaitPromise.all`，本轮已修成可读代码。
3. 原文把 `cypher.md`、`cypher2.md` 放在课程根目录；本轮为满足课程 Markdown 规则并补回排序，将它们整理到了 `queries/00-cypher.md`、`queries/01-cypher2.md`。
4. 原文示例使用 `OPENAI_*` 风格变量；按当前项目和用户说明，Lesson 28 已改为和 Lesson 27 一致的 `ESAGENT_*` 变量。
5. 原文默认可以直接 `pnpm install neo4j-driver` 后运行；当前仓库规则要求 lesson 不单独安装依赖，因此 README 中改为明确说明“依赖统一走项目根环境”。

## 后续复习要注意的坑

- `src/02-neo4j-test.mjs` 的删除节点示例仍然使用原文的 `DELETE p`；如果节点还有关系，真实执行会失败，这正好可以和 `queries/01-cypher2.md` 的删除规则一起理解。
- `src/03-graphrag.mjs` 的前提是假设图里已经有奶茶相关节点和关系；如果没先手动建图，GraphRAG 自然查不出结果。
- 这节课的重点是“关系检索工作流”，不是完整生产级知识图谱系统；数据清洗、实体抽取质量、图谱更新策略和评测都还没展开。
- 图检索适合关系和路径问题，但不能替代全文语义检索；后续复习时要把它和 Milvus / ES 放到互补关系里看。

## 自检记录

- `_shared/` 抽离结果：已创建 `src/_shared/env.mjs`；模型工厂复用仓库级 `@lessons/shared/model`，没有新增 lesson 内转发版 `_shared/model.mjs`。
- lessons 子课程根目录 Markdown 文件检查：通过。根目录现在只保留 `README.md`、`REVIEW_NOTES.md` 两份 Markdown。
- lessons 子课程依赖安装位置检查：通过。课程目录下没有独立 `node_modules`。
- 编号示例 import 检查：通过。本课没有编号示例文件互相 import。
- `node --check` 检查：通过。本轮已重新执行 `npm run check`，`src/_shared/env.mjs`、`src/02-neo4j-test.mjs`、`src/03-graphrag.mjs` 都已通过。
- README 依赖分类：已补齐，区分了语法检查、需要模型 API、需要外部服务、外部服务不可用时的复习路径。
- `package.json` / README 环境变量说明：已补齐；README 已说明读取项目根 `.env`。
- 降级复习说明：已补齐；没有新增任何“非原文示例” fallback 文件。
- 原文代码注释保留检查：通过。原有注释未被静默删除，只补充了复习型注释和依赖边界说明。

## 推荐复习顺序

1. 先看 `queries/00-cypher.md`，把节点类型、关系方向和多跳查询记住。
2. 再看 `queries/01-cypher2.md`，理解属性更新、关系删除和节点删除的区别。
3. 然后看 `src/02-neo4j-test.mjs`，理解 driver 如何把 Cypher 发给数据库。
4. 最后看 `src/03-graphrag.mjs`，重点观察四个节点函数与 LangGraph 的编排方式。
