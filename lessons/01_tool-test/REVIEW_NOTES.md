# REVIEW NOTES（复习笔记）

## 1. 原文与整理范围

- 原文：《从 Tool 开始：让大模型自动调工具读文件》
- 课程主线（对应 README 第 6 节机制清单）：让只能「说」的模型通过 `bindTools` 拿到工具说明 → 模型返回 `tool_calls` → 应用侧执行工具 → `ToolMessage` 回填 → 模型给出最终解释。获取 api key、`.env` 配置、`mkdir` + `npm init` 属于当时的前置操作，不进入复习主线。
- 原文结尾预告「简易版 cursor」。本目录保留了 mini cursor 与 MCP 示例作为延续内容，它们不属于本文正文示例，但同属本课学习主线，因此一起编号。

## 2. 文章主线 ↔ 代码对应

| 原文位置 / 知识点 | 对应文件 | 说明 |
| --- | --- | --- |
| 「创建项目：`mkdir tool-test` / `npm init -y`」 | `package.json` | 项目名保持 `tool-test`，与原文一致 |
| `src/hello-langchain.mjs` 直接写 apiKey + baseURL | `src/00-hello-langchain.mjs`（顶部复习注释记录了这段演进） | 原文点名文件，只加编号前缀 |
| 改成 dotenv + `.env` 读取 | `src/00-hello-langchain.mjs` + `lessons/_shared/env-loader.mjs`（跨课共享） | 由共享入口从仓库根 `.env` 读取 |
| `temperature` 设为 0 | `lessons/_shared/model.mjs`（`createChatModel` 默认 0） | 每个示例不再重复声明 |
| `src/tool-file-read.mjs` 定义 read_file | `src/01-tool-file-read.mjs` | 原文核心示例 |
| `tool()` + zod schema + `name` / `description` | 同上 | 原文注释与代码结构保留 |
| `model.bindTools(tools)` | 同上 | 同上 |
| 四种消息角色说明 | 同上（注释保留） | SystemMessage / HumanMessage / AIMessage / ToolMessage |
| 按 `tool_calls` 执行工具并回填 `ToolMessage` | 同上（`while (true)` + `for`） | 原文用 `while` + `Promise.all`，差异见第 10 节 |
| 「后面我们实现一个简易版 cursor」 | `src/03-mini-cursor.mjs`、`src/_shared/all-tools.mjs`、`src/02-node-exec.mjs` | 文章后续章节内容 |
| 课程仓库地址 | 未拷贝仓库代码 | 原文给出的 GitHub 地址未在本地复制 |

## 3. 本次整理做了什么

1. 学习主线编号：`src/` 下 4 个示例 + `src/04-mcp/` 下 3 个示例，全部加连续等宽前缀。
2. 消除编号示例之间的 import：`all-tools.mjs` 移入 `src/_shared/all-tools.mjs`，示例 03 改为从 `_shared` 引入。
3. 图片处理：原文 14 张配图全部删除，`assets/` 目录已移除，本课不再包含图片资产（理由与知识去向见第 15 节）。
4. 文档补齐：新增 `README.md`（学习路径、运行方式分组、核心机制、与原文差异、常见报错）与 `REVIEW_NOTES.md`。
5. 引用同步：代码内路径、注释里的运行命令、`package.json` 脚本、根 `README.md`、`lessons/_shared/reviews/stage-01-langchain/*.md` 中的旧路径全部更新。
6. 复习型注释：9 个 `.mjs` 文件都补了文件头说明（解决什么问题、对应原文哪一段、依赖与局限），原文注释一律保留。

## 4. 命名调整与结构调整

命名调整（只加前缀，文件名主体不变）：

| 原路径 | 编号路径 |
| --- | --- |
| `src/hello-langchain.mjs` | `src/00-hello-langchain.mjs` |
| `src/tool-file-read.mjs` | `src/01-tool-file-read.mjs` |
| `src/node-exec.mjs` | `src/02-node-exec.mjs` |
| `src/mini-cursor.mjs` | `src/03-mini-cursor.mjs` |
| `src/mcp/my-mcp-server.mjs` | `src/04-mcp/01-my-mcp-server.mjs` |
| `src/mcp/langchain-mcp-test.mjs` | `src/04-mcp/02-langchain-mcp-test.mjs` |
| `src/mcp/mcp-test.mjs` | `src/04-mcp/03-mcp-test.mjs` |

结构调整：

- `src/mcp/` → `src/04-mcp/`：MCP 是本课最后一个学习阶段，属于「阶段目录」，按编号规则一并编号，目录内示例重新按 01/02/03 排序。
- `src/all-tools.mjs` → `src/_shared/all-tools.mjs`：它被示例 03 import，如果继续留在编号序列里就形成「编号示例 import 编号示例」，按规则必须放进 `_shared/`。
- `src/mcp/route.md` 随目录移动为 `src/04-mcp/route.md`，内容未改动。
- `src/tool-file-write.mjs` 位置与文件名保持不变（示例 01 的写入目标路径，属于外部引用兼容路径）。

## 5. 编号与排序检查结果

按名称升序列出整理后结构（排除 `node_modules`、`package-lock.json`、`.vite-cache`）：

```txt
package.json
README.md
REVIEW_NOTES.md
src/_shared/all-tools.mjs
src/00-hello-langchain.mjs
src/01-tool-file-read.mjs
src/02-node-exec.mjs
src/03-mini-cursor.mjs
src/04-mcp/01-my-mcp-server.mjs
src/04-mcp/02-langchain-mcp-test.mjs
src/04-mcp/03-mcp-test.mjs
src/04-mcp/route.md
src/tool-file-write.mjs
react-todo-app/
vite-project/
```

- 编号宽度统一为两位（`00-` ～ `04-`），阶段目录内同样两位，无重复、无跳号。
- 升序排列即学习顺序，与 README 第 2 节的表格一致。
- 课程根目录只有 `README.md` 与 `REVIEW_NOTES.md` 两份 Markdown；`assets/` 目录已删除，本课没有任何图片资产。

## 6. 未编号项与例外依据

| 未编号项 | 例外依据 |
| --- | --- |
| `src/tool-file-write.mjs` | 示例 01 的运行产物（内容与示例 01 相同），同时是示例 01 的写入目标路径，保留原名以便复现写文件链路 |
| `src/04-mcp/route.md` | 一次 MCP 任务留下的输出结果（路线规划文本），不是示例脚本 |
| `react-todo-app/` | 独立完整应用（示例 03 生成并由 Agent 写入的 TodoList），保留框架约定目录与文件名 |
| `vite-project/` | `create-vite` 默认脚手架基线，用于与 `react-todo-app` 对比，保留框架目录结构 |
| `src/_shared/all-tools.mjs` | 公共模块，不参与示例编号 |

独立应用不参与编号，因此其内部阅读顺序在 README 第 2 节明确写出（`react-todo-app`：`App.tsx` → `App.css` → `main.tsx` → `index.html`）。

## 7. 公共代码抽离结果

| 抽离对象 | 位置 | 使用它的文件 | 结论 |
| --- | --- | --- | --- |
| 模型初始化 + env 读取 | `lessons/_shared/model.mjs`、`lessons/_shared/env-loader.mjs` | 本课 4 个模型示例全部复用 | 项目级共享，本课不再重复实现 |
| 4 个基础工具（读/写/执行命令/列目录） | `src/_shared/all-tools.mjs`（课内共享） | `src/03-mini-cursor.mjs` 1 个文件 | 因「编号示例不得互相 import」而抽离，非因复用次数 |

跨课重复检查：`lessons/13_mini_cursor/src/test/03-all-tools.mjs` 与本课工具集是同构实现（同一套 read/write/execute_command/list_directory）。按文件数统计，使用这套工具的文件是 `01_tool-test/src/03-mini-cursor.mjs` 与 `13_mini_cursor/src/test/04-stream-mini-cursor.mjs`，共 **2 个文件，未超过 3 个文件阈值**，因此本轮不迁移到 `lessons/_shared/`。
后续注意：如果 `16_LCEL-chain`、`20_nest+openclew`、`31_deep-research-assistant` 等课程继续复制同一套工具，使用文件达到 4 个时必须改为 `lessons/_shared/`，并同步更新引用、包导出和依赖。

保留在原文示例内的重复代码（刻意不抽离）：

- `src/01-tool-file-read.mjs` 内部仍有自己的 `readFileTool` / `writeFileTool` 定义，与 `src/_shared/all-tools.mjs` 同名。原因：这是原文点名示例，工具定义本身就是文章要讲的内容，抽空会失去与文章的对照性；规则允许原文点名入口保留必要重复，此处按要求记录理由。

## 8. import 检查结果

- 本课唯一的相对 import：`src/03-mini-cursor.mjs` → `./_shared/all-tools.mjs`（公共模块）。
- 不存在「编号示例 import 另一个编号示例」。
- `src/04-mcp/02`、`src/04-mcp/03` 通过 `join(__dirname, "01-my-mcp-server.mjs")` 启动 MCP Server，属于子进程路径而不是模块 import，已随编号同步更新。

## 9. 原文注释保留情况

- `src/02-node-exec.mjs`：原文被注释掉的 Linux / Windows 演进代码全部保留，未删除、未改写。
- `src/01-tool-file-read.mjs`、`src/03-mini-cursor.mjs`、`src/_shared/all-tools.mjs`、`src/04-mcp/*`：原有中文注释（编号分节注释、知识点说明、调试注释）全部保留。
- `src/04-mcp/02-langchain-mcp-test.mjs`：原文【实验步骤】里的旧文件名必须更新，处理方式是**保留原步骤 + 追加「补充说明」**，并说明 `MultiServerMCPClient` 会自动拉起服务器，第 1/5/7 步不需要手动执行。
- 新增内容都是文件头复习注释与 README / REVIEW_NOTES，没有用新注释替换原文注释。

## 10. 与原文的差异（复习时必须知道）

1. **模型初始化**：原文先写死 apiKey，再改成 `dotenv` + `new ChatOpenAI({...})`；本课统一走 `@lessons/shared/model` 的 `createChatModel()`，能力等价，避免每个示例重复初始化。原文的两段演进代码在本课以注释形式保留（`src/00-hello-langchain.mjs` 顶部）。
2. **工具范围**：原文的 `tool-file-read.mjs` 只定义 `read_file`；本课文件额外定义了 `write_file`，并要求把结果写入 `src/tool-file-write.mjs`，用于演示写文件链路。
3. **循环写法**：原文用 `while` 判断 `tool_calls` 是否为空 + 并发（`Promise.all`）收集工具结果；本课文件用 `while (true)` + `for` 顺序执行，便于逐条观察入参与结果。复习重点是循环与 `tool_call_id` 关联，并发或顺序不影响语义（差异表见 README 第 7 节）。

   机制级伪代码（两个版本共用同一套机制，不涉及具体语法）：

   ```txt
   response = 调用模型(messages)            # 模型这一轮可能返回 tool_calls
   把 response 追加进 messages

   只要 response 里有 tool_calls：
       对每个 tool_call 执行对应工具         # 原文并发收集、本课顺序执行，都是一次调用对应一个结果
       对每个 tool_call 按序号 i：
           追加 ToolMessage(结果_i, tool_call_id = tool_call.id) 进 messages
       response = 调用模型(messages)         # 把工具结果交回模型，进入下一轮
       把 response 追加进 messages

   输出 response 的内容                     # 此时没有 tool_calls，循环结束
   ```

   - 并发与顺序只影响「结果怎么收集」：原文先并发收集成结果数组、再用下标与 `tool_call_id` 对齐；本课逐条执行、逐条回填。
   - 原图 `12-tool-loop-code.png` / `13-toolmessage-loop-code.png` 已删除，这里只保留机制说明，不再复制原文源码。
4. **额外内容**：`node-exec`、`mini-cursor`、`04-mcp/*` 不是本文正文示例，来自文章后续章节（简易版 cursor）与 MCP 工具复用，已在 README 第 3 节说明。

## 11. 运行检查结果

`node --check` 全部通过（9 个文件）：

```txt
OK  src/00-hello-langchain.mjs
OK  src/01-tool-file-read.mjs
OK  src/02-node-exec.mjs
OK  src/03-mini-cursor.mjs
OK  src/_shared/all-tools.mjs
OK  src/tool-file-write.mjs
OK  src/04-mcp/01-my-mcp-server.mjs
OK  src/04-mcp/02-langchain-mcp-test.mjs
OK  src/04-mcp/03-mcp-test.mjs
```

未执行的运行项及原因：

| 未执行 | 原因 |
| --- | --- |
| `node src/00-hello-langchain.mjs`、`src/01`、`src/03`、`src/04-mcp/02`、`src/04-mcp/03` | 需要模型 API（根 `.env`），且属于会真实写文件/执行命令的路径，本次未验证 |
| `node src/03-mini-cursor.mjs` | 会删除并重建 `react-todo-app`，并执行 `npm run dev -- --host` 启动开发服务器占用端口 |
| `node src/02-node-exec.mjs` | 会执行 `npx create-vite` 在当前目录创建同名 `react-todo-app` |
| `pnpm --filter tool-test run check` | 与逐文件 `node --check` 等价，已在本地逐文件执行通过 |

按项目规则，本次没有启动任何常驻服务或占用本地端口。

## 12. 依赖分类结果（与 README 第 4 节一致）

- 语法检查（无密钥）：全部 9 个文件的 `node --check`。
- 无需模型 API 可运行：`src/04-mcp/01-my-mcp-server.mjs`（等待 stdin 的调试模式）、`src/02-node-exec.mjs`（需网络）。
- 需要模型 API：`src/00`、`src/01`、`src/03`、`src/04-mcp/02`、`src/04-mcp/03`。
- 需要外部服务 / 网络：`src/02`、`src/03`（`npx create-vite`、`npm install`）；`src/04-mcp/03`（`npx` 拉起的 filesystem MCP Server、高德 MCP key）。
- 无数据库依赖：本课不涉及 MySQL / Docker，不受项目「无数据库环境」边界限制。

## 13. 环境变量说明

- 变量来源：**仓库根目录 `.env`**（由 `lessons/_shared/env-loader.mjs` 加载），本课不单独维护环境变量示例文件。
- 必需：`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MODEL_NAME`。
- 仅 `src/04-mcp/03-mcp-test.mjs` 需要：`AMAP_MAPS_API_KEY`、`ALLOWED_PATHS`。
- 待补：根 `.env.example` 目前没有 `AMAP_MAPS_API_KEY` 和 `ALLOWED_PATHS` 两行，建议后续补齐。

## 14. 降级复习说明

- 原文没有提供 fallback，用户也未要求新增，因此**本课没有新增 fallback 示例文件**。
- 外部服务不可用时的最小复习路径（README 4.5 已写明）：只读 00 → 01 理解消息角色与 tool 循环；无模型 API 时只做语法检查并手写 tool 循环主干；不运行示例 03（改为阅读 `react-todo-app/src/App.tsx`）；先跑 04-01 + 04-02，多源 MCP 部分按配置阅读。

## 15. 图片处理结果

- 原文 14 张配图全部删除，`assets/` 目录已移除，本课不再包含任何图片资产。
- 三类图片都不承担长期复习价值：平台操作类（登录 / 领额度 / 获取 API Key / `mkdir` + `npm init` / baseURL 文档页）、源码截图类（dotenv 初始化、`tool()`、`bindTools`、工具循环、`ToolMessage` 回填、第一次 invoke）、运行输出类（首次调用与最终回复）。
- 知识去向（删图不丢机制）：Tool 机制见 README 第 6 节；原文并发写法见第 10 节的机制级伪代码；模型真实返回的 `tool_calls` 字段（`content` 为空、`finish_reason` 为 `tool_calls`、含 `id` / `name` / `args` / `type`）见 README 第 6 节第 4 条。
- 判定方式：图片内容用 Windows 内置 OCR（`Windows.Media.Ocr`，zh-Hans-CN）逐张识别，不按文件名或正文相邻段落推断。OCR 只读文字、看不出图标与连线；如需恢复某张原图，请回原文 PDF 人工复核。

## 16. Gap 与后续注意

- [ ] `@lessons/shared` 未写进本课 `package.json` 依赖（`12_output-parser-test`、`13_mini_cursor`、`14_prompt-template-test` 同样未声明），当前依赖根 workspace 解析。如需规范声明，应同时更新根锁文件。
- [ ] `lessons/13_mini_cursor/src/test/03-all-tools.mjs` 被同目录 `04-stream-mini-cursor.mjs` 以相对路径 import，与本课整理后的做法不一致；`13_mini_cursor` 还用未编号的 `src/test/` 作为阶段目录。本轮只报告，不修改其他课程。
- [ ] `vite-project/` 与 `react-todo-app/` 脚手架重复，是否保留作为「基线对照」需要你确认；删除它将影响 pnpm workspace 成员与锁文件。
- [ ] 根 `.env.example` 建议补 `AMAP_MAPS_API_KEY`、`ALLOWED_PATHS`。
- [ ] 示例 03 的危险动作（删除目录、启动服务）建议后续加白名单与目录隔离（README 待办已记录）。

