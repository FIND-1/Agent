# 16_LCEL-chain：LCEL 组装 Chain 实战

本 lesson 对应 `SUMMARY_RULES.txt` 中的文章《实战练习 LCEL 组装 chain》。文章主线是：把前面学过的 MCP、RAG、Prompt Template、Output Parser 等能力，用 LCEL 的 `Runnable` API 重新组织成可组合、可统一调用的 chain。

## 1. 为什么需要 LCEL

普通写法通常是手动控制调用顺序：

```text
调用模型 -> 判断 tool_calls -> 调工具 -> 写回 messages -> 再调用模型
```

LCEL 的做法是把每一步都变成 `Runnable`：

```text
PromptTemplate -> Model -> Branch -> Tool Executor
```

所有 Runnable 都可以统一使用 `invoke`、`batch`、`stream`，并且可以继续加 `withRetry`、`withFallbacks`、`withConfig`、`callbacks`。

## 2. 核心学习路径

目录按文章顺序排序，文件夹也保留语义并编号：

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

学习顺序：

1. `01-case/00-mcp-test.mjs`  
   把 MCP Agent 改造成 LCEL：`PromptTemplate -> bindTools model -> RunnableBranch -> ToolMessage`。

2. `01-case/01-ebook-reader-rag.mjs`  
   把 RAG + Milvus 改造成 LCEL：`Milvus 检索 -> 构建 context -> PromptTemplate -> model -> StringOutputParser`。

3. `01-case/02-rag-local-fallback-chain.mjs`  
   本地 fallback 复习路径。不依赖 Milvus，用固定片段模拟检索，保留 RAG 主线。

4. `02-runnable/00-RunnableWithRetry.mjs`  
   演示 `withRetry`，给单个 Runnable 节点加自动重试。

5. `02-runnable/01-RunnableWithFallbacks.mjs`  
   演示 `withFallbacks`，主方案失败后按顺序切换备选 Runnable。

6. `02-runnable/02-RunnableWithConfig.mjs`  
   演示 `withConfig`，节点通过第二个参数读取运行时配置。

7. `02-runnable/03-RunnableWithCallbacks.mjs`  
   演示 callbacks，观察 chain 每一步的开始、结束和错误。

## 3. API 速查

| API | 解决的问题 | 典型文件 |
| --- | --- | --- |
| `RunnableSequence.from([...])` | 顺序组合多个步骤 | `01-ebook-reader-rag.mjs` |
| `RunnableLambda.from(fn)` / `new RunnableLambda` | 把自定义函数包装成 Runnable | 全部示例 |
| `RunnableBranch.from([...])` | 根据条件走不同分支 | `00-mcp-test.mjs` |
| `RunnablePassthrough.assign()` | 在 state 上追加中间结果 | `00-mcp-test.mjs` |
| `ChatPromptTemplate` / `PromptTemplate` | 组装模型输入 | `00-mcp-test.mjs`、`01-ebook-reader-rag.mjs` |
| `MessagesPlaceholder` | 在 prompt 中插入历史 messages | `00-mcp-test.mjs` |
| `ToolMessage` | 把工具调用结果写回对话上下文 | `00-mcp-test.mjs` |
| `StringOutputParser` | 把模型输出转成字符串 | `01-ebook-reader-rag.mjs` |
| `withRetry` | 同一个节点失败后自动重试 | `00-RunnableWithRetry.mjs` |
| `withFallbacks` | 主节点失败后切换备选节点 | `01-RunnableWithFallbacks.mjs` |
| `withConfig` | 给 chain 注入运行时配置 | `02-RunnableWithConfig.mjs` |
| `callbacks` | 观察每一步执行过程 | `03-RunnableWithCallbacks.mjs` |

## 4. 概念关系

```text
Runnable 是 LCEL 的基本单元
  -> PromptTemplate 是 Runnable
  -> bindTools 后的 model 是 Runnable
  -> 自定义函数可以包装成 RunnableLambda
  -> 多个 Runnable 可以组成 RunnableSequence
  -> 条件判断可以交给 RunnableBranch
```

文章想教会的是：先分析流程，拆成原子步骤，再根据步骤关系选择 Runnable API，最后统一调用。

## 5. 安装与环境变量

当前项目是 pnpm workspace，lesson 默认复用根目录 Node 包。新增通用依赖优先安装到 workspace root：

```powershell
# From the repository root:
pnpm add -w <package-name>
```

本 lesson 不单独维护环境变量示例文件。当前项目统一使用根目录 `.env`，本 lesson 会读取这些变量：

```text
OPENAI_API_KEY=
OPENAI_BASE_URL=
MODEL_NAME=
EMBEDDINGS_MODEL_NAME=
AMAP_MAPS_API_KEY=
MILVUS_ADDRESS=localhost:19530
```

## 6. 运行示例

### 语法检查

```powershell
node --check .\src\01-case\00-mcp-test.mjs
node --check .\src\01-case\01-ebook-reader-rag.mjs
node --check .\src\01-case\02-rag-local-fallback-chain.mjs
node --check .\src\02-runnable\00-RunnableWithRetry.mjs
node --check .\src\02-runnable\01-RunnableWithFallbacks.mjs
node --check .\src\02-runnable\02-RunnableWithConfig.mjs
node --check .\src\02-runnable\03-RunnableWithCallbacks.mjs
```

### 无需 API Key，可直接复习

```powershell
node .\src\01-case\02-rag-local-fallback-chain.mjs
node .\src\02-runnable\00-RunnableWithRetry.mjs
node .\src\02-runnable\01-RunnableWithFallbacks.mjs
node .\src\02-runnable\02-RunnableWithConfig.mjs
node .\src\02-runnable\03-RunnableWithCallbacks.mjs
```

### 需要模型 API

```powershell
node .\src\01-case\00-mcp-test.mjs
```

还需要 `AMAP_MAPS_API_KEY`，并且 `chrome-devtools-mcp` 第一次运行可能通过 `npx` 下载。

### 需要外部服务

```powershell
node .\src\01-case\01-ebook-reader-rag.mjs
```

还需要：

- 模型 API 和 embedding API
- Milvus 监听 `localhost:19530` 或 `.env` 中的 `MILVUS_ADDRESS`
- 已存在并加载 `ebook_collection`
- collection 向量维度与 `VECTOR_DIM = 1024` 一致

## 7. 常见报错

- `ERR_MODULE_NOT_FOUND`：根目录依赖未安装或 workspace node_modules 不完整。按项目约定在根目录运行 `pnpm install`。
- `AMAP_MAPS_API_KEY` 为空：MCP 地图工具无法调用。
- `connect ECONNREFUSED 127.0.0.1:19530`：Milvus 未启动。先看 `03-rag-local-fallback-chain.mjs` 复习主线。
- `collection not found`：Milvus 中没有 `ebook_collection`。
- `dimension mismatch`：embedding 维度与 Milvus collection 维度不一致。

## 8. 当前项目注意事项

- 本次整理保留了 `case` 和 `runnable` 的语义，只给文件夹和文件加编号。
- 文件顺序按 `SUMMARY_RULES.txt` 文章顺序排列，不按文件创建时间排列。
- 原文注释语义已恢复为中文，并在顶部补充复习型注释。
- `03-rag-local-fallback-chain.mjs` 是新增 fallback，用于没有 Milvus 时复习。

## 9. 复习重点

- LCEL 的核心是把流程组件化，不是单纯把代码写短。
- `RunnableSequence` 负责线性流程。
- `RunnableBranch` 负责条件分支。
- `RunnableLambda` 承接业务自定义逻辑。
- `RunnablePassthrough.assign` 适合把中间结果挂到 state。
- `ToolMessage` 是工具调用结果回到模型上下文的关键。
- RAG 可以拆成“检索 -> 构建 prompt -> 模型 -> parser”。
- `withRetry`、`withFallbacks`、`withConfig`、`callbacks` 是 chain 的工程化增强能力。
