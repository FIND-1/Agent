# 从 Tool 开始：让大模型自动调工具读文件

本课回答一个核心问题：**模型只会「说」，怎么让它真的「做」**。代码源自课程仓库的 `tool-test` 项目，在原文基础上保留了后续延续示例（mini cursor、MCP），并按学习顺序编号。

## 1. 学习目标

- 用 `.env` + dotenv 管理模型密钥，不把 apiKey 写死在代码里
- 分清四种消息：`SystemMessage` / `HumanMessage` / `AIMessage` / `ToolMessage`
- 用 `tool()` + zod 定义工具，用 `model.bindTools()` 把工具交给模型
- 理解 `tool_calls` 只是「参数」，工具真正执行在应用侧
- 用 `ToolMessage` + `tool_call_id` 把结果回填，形成 tool 循环
- 延伸：多工具循环（mini cursor）、`child_process.spawn`，以及 MCP 工具复用

## 2. 文件学习顺序（按名称升序就是学习顺序）

| 顺序 | 文件 | 学习目的 | 模型 API |
| --- | --- | --- | --- |
| 00 | `src/00-hello-langchain.mjs` | 最小模型调用，先确认环境能跑通 | 需要 |
| 01 | `src/01-tool-file-read.mjs` | **文章主线**：tool 定义 + `bindTools` + ToolMessage 循环 | 需要 |
| 02 | `src/02-node-exec.mjs` | `execute_command` 的底层：spawn / shell / 交互式输入 | 不需要 |
| 03 | `src/03-mini-cursor.mjs` | 把工具串成 agent，完成「创建 React TodoList 项目」 | 需要 |
| 04-01 | `src/04-mcp/01-my-mcp-server.mjs` | 自己写 MCP Server：Tool + Resource + stdio | 不需要 |
| 04-02 | `src/04-mcp/02-langchain-mcp-test.mjs` | LangChain 作为 MCP Client（含 Resource 注入 SystemMessage） | 需要 |
| 04-03 | `src/04-mcp/03-mcp-test.mjs` | 多源 MCP：本地 stdio + 高德 HTTP + filesystem | 需要 |
| 公共 | `src/_shared/all-tools.mjs` | 4 个基础工具的公共模块，供示例 03 复用 | 不需要 |

未编号文件的例外依据：

- `src/tool-file-write.mjs`：示例 01 的**运行产物**，同时是示例 01 的写入目标路径（外部引用路径），保留原文件名。
- `src/04-mcp/route.md`：一次 MCP 任务留下的输出结果（路线规划文本），不是示例脚本。
- `react-todo-app/`：**独立完整应用**（示例 03 生成并由 Agent 写入的 TodoList），保留框架约定目录与文件名，不参与编号。
- `vite-project/`：`create-vite` 默认脚手架基线，用于和 `react-todo-app` 对比「脚手架原始页面 vs Agent 写入后的结果」，同样不参与编号。

独立应用的内部阅读顺序：

1. `react-todo-app/src/App.tsx`：TodoList 逻辑（增删改、筛选、localStorage）→ `src/App.css`（样式）→ `src/main.tsx` → `index.html`。
2. `vite-project/src/App.tsx`：只看这一个文件即可，它是脚手架默认页面，用于对比。

## 3. 原文路径映射

| 原文路径 / 命令 | 整理后路径 / 命令 | 说明 |
| --- | --- | --- |
| `src/hello-langchain.mjs` | `src/00-hello-langchain.mjs` | 只加排序前缀，文件名主体不变 |
| `src/tool-file-read.mjs` | `src/01-tool-file-read.mjs` | 文章主线示例 |
| `node ./src/hello-langchain.mjs` | `node src/00-hello-langchain.mjs` | 原文命令保留对照 |
| `node ./src/tool-file-read.mjs` | `node src/01-tool-file-read.mjs` | 同上 |
| `src/tool-file-write.mjs` | 不变 | 示例 01 的写入目标路径，保留原名 |

原文没有点名 `node-exec.mjs`、`all-tools.mjs`、`mini-cursor.mjs`、`mcp/*`；它们来自文章后续章节（例如结尾预告的「简易版 cursor」）以及 MCP 工具复用，属于本课保留的延续学习内容，同样按顺序编号。

## 4. 运行方式（按依赖强度分组）

### 4.1 语法检查（不需要任何密钥）

```bash
pnpm --filter tool-test run check
```

等价于对 9 个 `.mjs` 文件逐个执行 `node --check`，只做语法检查，不调用模型、不执行命令。

### 4.2 无需模型 API 可运行

```bash
node src/04-mcp/01-my-mcp-server.mjs   # 单独调试服务器：只等待 stdin，不会自己输出，Ctrl+C 退出
node src/02-node-exec.mjs              # 会执行 create-vite，需要网络；见 4.6 风险提示
```

### 4.3 需要模型 API

变量来自**仓库根目录** `.env`（本课不单独维护 `.env`）：

```bash
node src/00-hello-langchain.mjs        # 最小模型调用
node src/01-tool-file-read.mjs         # tool 循环；会写入 src/tool-file-write.mjs
node src/03-mini-cursor.mjs            # 多工具 agent；见 4.6 风险提示
node src/04-mcp/02-langchain-mcp-test.mjs
node src/04-mcp/03-mcp-test.mjs        # 另需 AMAP_MAPS_API_KEY / ALLOWED_PATHS
```

### 4.4 需要外部服务或网络

- 示例 02 / 03：`npx create-vite`、`npm install` 需要网络。
- 示例 04-03：`filesystem` MCP Server 由 `npx` 拉起，需要联网；高德 MCP 需要可用的 key。

### 4.5 外部服务不可用、或不想动环境时的复习路径

1. 只读 00 → 01，理解消息角色和 tool 循环；这两步只需要模型 API。
2. 没有模型 API 时只做 4.1 的语法检查，并对照第 6 节机制清单，手写一遍 tool 循环主干。
3. 不要为了复习运行示例 03：它会删除并重建 `react-todo-app`，最后还会启动 Vite 服务。改为阅读 `react-todo-app/src/App.tsx` 观察 Agent 写入后的产物。
4. 暂时不运行 04-03：先跑 04-01（调试服务器）+ 04-02（单服务器客户端），多服务器部分按配置阅读。

### 4.6 运行风险提示

- 示例 02 会在**当前工作目录**创建 `react-todo-app`，与本课已有应用同名。复习时请在临时目录运行，或先确认不会覆盖已整理的应用。
- 示例 03 的 SystemMessage 里写死了 `rmdir /s /q react-todo-app`、`npm run dev -- --host` 等 Windows 命令：直接运行会删除并重建 `react-todo-app`，并启动开发服务器占用端口。
- `execute_command` 没有任何命令白名单或权限校验，属于学习示例，不要传入来源不明的命令。

## 5. 环境变量

统一使用仓库根目录 `.env`：

```bash
OPENAI_API_KEY=你的 api key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-coder-turbo
# 仅示例 04-03 需要
AMAP_MAPS_API_KEY=高德 MCP 使用的 key
ALLOWED_PATHS=filesystem MCP 允许访问的目录白名单，多个目录用英文逗号分隔
```

`.env` 已被项目 `.gitignore` 忽略，密钥不要提交到仓库。

## 6. 核心机制（复习主线）

1. **它解决什么问题**：模型只能输出文本，不能读文件、写文件、执行命令。Tool 就是把这类「动作能力」交到模型手里的机制——cursor 能改代码、装依赖、跑项目就是这么实现的。
2. **Tool 的三要素**：函数体 + `name` / `description` + 参数格式（zod schema）。`description` 写不清，模型会不调用工具或把参数写错；schema 决定模型能生成哪些字段。
3. **`bindTools` 做了什么**：只把工具说明书（名称、描述、参数 schema）随请求一起发给模型，让模型知道有哪些工具可用。它不执行任何工具，也不改变模型本身的能力。
4. **`tool_calls` 是什么**：模型在回复里给出的「调用意图」，结构是 `{ id, name, args, type: "tool_call" }`——只有工具名和参数，没有任何执行结果；`id` 由模型生成，标识这一次调用。原文运行输出的这一轮就长这样：`content` 为空、`finish_reason` 为 `tool_calls`，模型没有任何「自己执行过」的痕迹。
5. **为什么工具必须由应用侧执行**：模型跑在远端，碰不到本地文件系统、shell 和网络，它只能「申请」调用；真正的执行发生在我们的进程里（`src/01-tool-file-read.mjs` 按 `name` 找到工具再 `invoke(args)`）。
6. **`ToolMessage` 的作用**：把工具执行结果作为一条消息回填进 `messages`，模型下一轮才能看到「你要的结果在这里」。四种消息各司其职：`SystemMessage` 定规则与流程、`HumanMessage` 是用户输入、`AIMessage` 是模型回复、`ToolMessage` 是工具结果回填；工具结果的发出方是应用而不是用户，所以不能塞进 `HumanMessage`。
7. **`tool_call_id` 为什么必要**：一轮回复可能包含多个工具调用，`ToolMessage` 靠 `tool_call_id` 与 `tool_calls[i].id` 一一对应；缺了它，模型无法判断这个结果属于哪一次调用。
8. **循环如何结束**：终止条件是模型这一轮**没有返回 `tool_calls`**，而是直接给自然语言答复。工程上还要加最大轮次上限（`src/03-mini-cursor.mjs` 的 `maxIterations = 30`），否则模型反复调工具会死循环。
9. **与 mini cursor / Agent 的关系**：`bindTools` + `while` 循环 + `ToolMessage` 回填就是所谓「Agent 循环」。把工具从 2 个扩到 4 个（读文件、写文件、执行命令、列目录），让模型自己决定调用顺序和停止时机，就是 `src/03-mini-cursor.mjs`——一个没有权限控制的迷你 cursor。
10. **与 MCP 的关系**：MCP 是工具的**另一种来源**：工具实现放进独立进程或服务，通过协议暴露出来。LangChain 这边仍是 `bindTools` + 同一套 `tool_calls` / `ToolMessage` 循环，机制不变（`src/04-mcp/*`）。
11. **工程习惯**：`temperature: 0` 让模型严格按指令执行、少自由发挥，本课所有示例都沿用它。

## 7. 当前代码与原文的关键差异

| 方面 | 原文 | 本课代码 | 复习影响 |
| --- | --- | --- | --- |
| 模型初始化 | 先把 apiKey 写死在代码里，再改成 `dotenv` + `new ChatOpenAI({...})` | 统一用 `@lessons/shared/model` 的 `createChatModel()`（`temperature: 0`） | 能力等价；原文两段演进代码保留在 `src/00-hello-langchain.mjs` 顶部注释 |
| 工具范围 | 只定义 `read_file` | 额外定义 `write_file`，把读到的内容写回 `src/tool-file-write.mjs` | 多一条写入链路，不影响 tool 循环本身 |
| 循环写法 | `while (response.tool_calls && ...)` + `Promise.all(...)` 并发执行，用 `toolResults[index]` 回填 | `while (true)` + `for` 顺序执行，逐条打印入参和结果 | 只影响执行顺序，不影响 `tool_call_id` 关联语义；原文写法说明见 `REVIEW_NOTES.md` 第 10 节 |
| 文件编号 | 原文示例无前缀 | 统一 `00-` ～ `04-` 编号，公共工具移到 `src/_shared/` | 见第 2 节 |

## 8. 常见报错

| 现象 | 原因与处理 |
| --- | --- |
| `401` / `Incorrect API key` | 根目录 `.env` 未配置，或 key 失效 |
| 模型不调用工具 | `description` 太模糊，或 system prompt 没有要求「必须调用工具」 |
| `读取文件失败: ENOENT ... src/tool-file-read.mjs` | 还在使用旧路径，编号后应为 `src/01-tool-file-read.mjs` |
| `系统找不到指定的文件` | 路径写错，或在 Windows 下用了 Linux 风格路径 |
| `spawn npx ENOENT`、`npx` 不识别 | 缺少 `shell: true`，或未联网 |
| `EADDRINUSE` | 示例 03 最后的 `npm run dev` 端口被占用；先确认端口归属，不要强杀别人的进程 |
| MCP 客户端报找不到服务器 | 服务器文件名写错；`01-my-mcp-server.mjs` 必须与 `join(__dirname, ...)` 保持一致 |

## 9. 后续复习建议与待办

- 建议复习顺序：先看 `src/00`、`src/01` 两个文件顶部的复习注释，再对照第 6 节机制清单；随后看 `src/03-mini-cursor.mjs` 理解「多轮循环 + 兜底解析」和示例 01 的差别；最后看 MCP 三件套。
- [ ] 把示例 03 的生成目录固定到 `_playground`，避免覆盖 `react-todo-app`
- [ ] 给 `execute_command` 增加命令白名单，降低复习时的误操作风险
- [x] 补充「示例 01 顺序执行」与「原文 `while` + `Promise.all` 并发执行」的对比说明（见第 7 节差异表与 `REVIEW_NOTES.md` 第 10 节）
- [ ] 本课与 `lessons/13_mini_cursor` 的工具集实现重复，后续按跨课共享阈值评估是否统一到 `lessons/_shared/`

