# 从 Tool 开始：让大模型自动调工具读文件

本课对应公众号文章《从 Tool 开始：让大模型自动调工具读文件》，代码源自课程仓库里的 `tool-test` 项目。
文章主线只有两步：**先把大模型调通**，再**用 tool 让模型能读写文件、执行命令**；文章结尾预告了「简易版 cursor」。
本目录在原文代码基础上，保留了后续相关的延续示例（mini cursor、MCP），并按学习顺序编号。

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
- `assets/`：文章配图，属于配套静态资源。

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
2. 没有模型 API 时只做 4.1 的语法检查，并对照第 6 节结论，手写一遍 tool 循环主干。
3. 不要为了复习运行示例 03：它会删除并重建 `react-todo-app`，最后还会启动 Vite 服务。改为阅读 `react-todo-app/src/App.tsx` 观察 Agent 写入后的产物。
4. 暂时不运行 04-03：先跑 04-01（调试服务器）+ 04-02（单服务器客户端），多服务器部分按配置阅读。

本课**不新增 fallback 示例**：原文没有提供 fallback，也不属于原文示例。

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

`.env` 已被项目 `.gitignore` 忽略；原文也强调这类私密信息不提交 git。

## 6. 关键结论

- 大模型本身只能「说」，不能「做」；tool 是把「做」的能力接给模型的方式，cursor 能写文件、装依赖、跑项目就是这么实现的。
- tool 三要素：函数体 + `name` / `description` + 参数格式（zod）。`description` 写不清，模型会不调用工具或把参数写错。
- `bindTools` 只是把工具说明交给模型；模型返回的 `tool_calls` 只有参数，执行必须由应用侧完成。
- 四种消息各司其职：`SystemMessage` 定规则与流程、`HumanMessage` 是用户输入、`AIMessage` 是模型回复、`ToolMessage` 是工具结果回填。
- `ToolMessage` 必须带 `tool_call_id`，模型才能把结果与某一次调用对上。
- 循环的终止条件是没有 `tool_calls`；为避免死循环必须设置最大轮次。
- `temperature: 0` 是原文特意强调的：让模型严格按指令执行，不要自由发挥。

## 7. 常见报错

| 现象 | 原因与处理 |
| --- | --- |
| `401` / `Incorrect API key` | 根目录 `.env` 未配置，或 key 失效 |
| 模型不调用工具 | `description` 太模糊，或 system prompt 没有要求「必须调用工具」 |
| `读取文件失败: ENOENT ... src/tool-file-read.mjs` | 还在使用旧路径，编号后应为 `src/01-tool-file-read.mjs` |
| `系统找不到指定的文件` | 路径写错，或在 Windows 下用了 Linux 风格路径 |
| `spawn npx ENOENT`、`npx` 不识别 | 缺少 `shell: true`，或未联网 |
| `EADDRINUSE` | 示例 03 最后的 `npm run dev` 端口被占用；先确认端口归属，不要强杀别人的进程 |
| MCP 客户端报找不到服务器 | 服务器文件名写错；`01-my-mcp-server.mjs` 必须与 `join(__dirname, ...)` 保持一致 |

## 8. 原文配图索引

文章正文共 14 张配图，已按正文出现顺序保存到 `assets/`，可对照复习：

| 图 | 文件 | 正文位置（相邻段落） | 对应知识点 |
| --- | --- | --- | --- |
| 01 | `assets/01-agent-tool-ability.png` | 「开发一些 tool 交给 agent 调用就可以了」 | 为什么要给 agent 加 tool |
| 02 | `assets/02-qwen-bailian-login.jpeg` | 「这里我们用阿里的千问……」 | 模型与免费额度说明 |
| 03 | `assets/03-get-api-key.png` | 「点这里获取 api key：」 | 控制台获取 api key |
| 04 | `assets/04-create-project-terminal.png` | `mkdir tool-test` / `npm init -y` | 初始化 `tool-test` 项目 |
| 05 | `assets/05-base-url.png` | 「base url 是这个：」 | DashScope 兼容模式 baseURL |
| 06 | `assets/06-dotenv-env-code.png` | 「用 dotenv 来读取环境变量：」 | dotenv 版模型初始化代码 |
| 07 | `assets/07-dotenv-note.png` | 「我们没有调用 dotenv.configure，引入了这个模块就行」 | dotenv 的加载方式 |
| 08 | `assets/08-tool-api-code.png` | 「然后创建一个 tool，调用 tool 的 api」 | `tool()` 的定义结构 |
| 09 | `assets/09-bindtools-code.png` | 「之后把这个 tool 传给大模型：」 | `model.bindTools(tools)` |
| 10 | `assets/10-first-invoke-output.png` | 「调用下：」 | 第一次 invoke 的输出 |
| 11 | `assets/11-tool-calls-output.png` | 「它返回了这个信息：」 | AIMessage 里的 `tool_calls` |
| 12 | `assets/12-tool-loop-code.png` | 「接下来我们基于这个参数调用下工具不就行了？」 | 按 `tool_calls` 执行工具 |
| 13 | `assets/13-toolmessage-loop-code.png` | 「把工具调用结果作为 ToolMessage 传给大模型」 | `ToolMessage` + `tool_call_id` 回填 |
| 14 | `assets/14-final-reply-output.png` | 「跑下试试：」 | 最终回复（代码解释） |

图注按正文相邻段落整理，用于把配图和知识点对齐；图片中的代码与正文代码一致，输出类截图属于运行结果记录。

## 9. 后续复习建议与待办

- 建议复习顺序：先看 `src/00`、`src/01` 两个文件顶部的复习注释，再对照第 6 节结论；随后看 `src/03-mini-cursor.mjs` 理解「多轮循环 + 兜底解析」和示例 01 的差别；最后看 MCP 三件套。
- [ ] 把示例 03 的生成目录固定到 `_playground`，避免覆盖 `react-todo-app`
- [ ] 给 `execute_command` 增加命令白名单，降低复习时的误操作风险
- [ ] 补充「示例 01 顺序执行」与「原文 `while` + `Promise.all` 并发执行」的对比说明
- [ ] 本课与 `lessons/13_mini_cursor` 的工具集实现重复，后续按跨课共享阈值评估是否统一到 `lessons/_shared/`

