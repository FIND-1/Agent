# Deep Research Assistant 复习整理记录

## 整理边界

本次用户提供的 `D:/360MoveData/Users/uu/Desktop/SUMMARY_RULES.txt` 实际内容是《DeepAgents 实战：多 Agent 架构的深度调研助手》文章原文，不是整理规范本身。整理规范来自项目根目录 `SUMMARY_RULES.md`；文章原文作为本课程的知识主线输入。

本课不涉及 Docker、MySQL、SQL、ORM、Milvus 或数据库。模型 API、Bocha 搜索 API 和可选的 LangSmith 追踪仍属于外部服务依赖；本次只做目录整理、源码静态检查和文档补齐，没有把真实模型调用、联网搜索或云端 trace 写成已验证结果。

## 文章想教会什么

文章从“middleware 分散、工具还需要额外写 prompt”这个问题切入，介绍 `createDeepAgent` 如何把常见能力组合成一个多 Agent 深度调研助手。主 Agent 不包办所有细节，而是按下面的链路协调工作：

1. 规划：生成中文 todo，并保存原始问题。
2. 调研：写研究计划，委派一个或多个 `researcher` 子 Agent 使用联网搜索。
3. 分析：遇到排名、总和、增长率等数字任务时，委派 `analyst` 用 QuickJS 执行 JavaScript。
4. 起草：主 Agent 读取 findings 和 analysis，自己写报告草稿。
5. 审阅：委派 `editor` 检查准确性、结构和引用，但不直接改写报告。
6. 定稿：主 Agent 根据审阅意见修订并保存最终报告。

这篇文章真正的核心不是某个单独 API，而是：**用 DeepAgents 的高阶入口，把规划、文件交接、角色分工、工具调用、技能提示词和上下文管理组合成可复习的 Agent 工作流。**

## 排序结果

| 顺序 | 原文点名路径 | 整理后路径 | 复习重点 |
| --- | --- | --- | --- |
| 00 | `src/tools/search.mjs` | `src/tools/00-search.mjs` | 自定义联网搜索 tool、Zod schema、错误处理 |
| 01 | `src/agent.mjs` | `src/01-agent.mjs` | `createDeepAgent`、主 Agent、researcher / analyst / editor |
| 02 | `src/cli.mjs` | `src/02-cli.mjs` | CLI 输入、流式 chunk、文件工具和 `eval` 观察 |
| 03 | `src/todo-middleware-test.mjs` | `src/03-todo-middleware-test.mjs` | `createAgent` + `todoListMiddleware` 对照实验 |
| 04 | `src/max-input-tokens-test.mjs` | `src/04-max-input-tokens-test.mjs` | 修改 `profile.maxInputTokens` 的上下文压缩配置 |

本次不新增排序目录，只在原有扁平结构中给入口补排序前缀；原文件名主体保留在前缀后。文章中提到的“QuickJS 沙箱执行代码”和“LangSmith 过滤 tool”不是独立入口：前者在 `analystSubAgent` 的 `createCodeInterpreterMiddleware()` 中，后者由 CLI 的事件日志和 LangSmith 外部界面共同观察。

## 文件与知识点导读

### 00：搜索工具

`src/tools/00-search.mjs` 将 Bocha API 封装为 LangChain `tool`：

- 用 Zod 限制 `query` 和 `count` 输入。
- 从根目录 `.env` 读取 `BOCHA_API_KEY`。
- 将 HTTP 错误、JSON 解析错误、业务错误和空结果转换成中文字符串，交给 Agent 继续处理。
- 将网页标题、URL、摘要、站点信息和抓取时间格式化成结构化文本。

它只负责“怎么搜”，不负责“什么时候搜”或“搜完写什么”；这些决策属于 `researcher` 和主 Agent。

### 01：主 Agent 与子 Agent

`src/01-agent.mjs` 是课程核心：

- `FilesystemBackend` 将 lesson 根目录映射成 Agent 可访问的虚拟 `/workspace/`。
- `memory: ["/AGENTS.md"]` 让主 Agent 读取中文报告偏好、数据口径和文件约定。
- `skills: ["/skills/"]` 让 Agent 按需读取 `web-research` 和 `report-writer`。
- `researcherSubAgent` 只允许 `webSearch`，并限制每个子主题的搜索次数和 findings 写入位置。
- `analystSubAgent` 挂载 `createCodeInterpreterMiddleware()`，要求所有数字通过 `eval` 计算。
- `editorSubAgent` 只返回审阅意见，不直接修改报告。
- `orchestratorPrompt` 明确主 Agent 的规划、委派、起草、审阅和定稿边界。

主 Agent、researcher、analyst、editor 合计构成文章所说的 4 个 Agent 角色。

### 02：CLI 观察入口

`src/02-cli.mjs` 不重新实现 Agent，而是把运行过程转成可读日志：

- `model_request` 显示主 Agent 或子 Agent 当前节点。
- 文件工具调用显示虚拟工作区中的路径。
- `eval` 调用显示代码和结果预览。
- `task` 结果显示子 Agent 完成摘要。
- 结束时列出 `workspace/sources` 和 `workspace/reports` 中的 Markdown 产物。

因此复习时应把 CLI 当成“观测层”，把编排逻辑回溯到 `agent.mjs`。

### 03：todo middleware 对照实验

`src/03-todo-middleware-test.mjs` 是文章后半段的独立实验，不是深度调研助手的必经链路。它从 `tmp.json` 读取已有 todo，通过 `createAgent` 和 `todoListMiddleware` 让模型根据清单汇总状态，重点是观察 todo 如何进入 graph state。

### 04：上下文压缩配置实验

`src/04-max-input-tokens-test.mjs` 只构造模型并打印 `profile.maxInputTokens`，然后通过 `Object.defineProperty` 覆盖该值。文章的判断是：上下文压缩的触发依赖模型 profile；如果兼容模型没有提供输入 token 上限，需要补充一个可用值。该文件不等于完整的长上下文压缩测试。

## 本次整理内容

### 1. 目录和排序

- 新增 `README.md`，提供按文章顺序的复习入口、运行命令、依赖分类、降级路径和常见问题。
- 新增 `REVIEW_NOTES.md`，记录本次整理决策和自检结果。
- 保持 5 个原文入口的扁平目录结构，不新增阶段目录；在原文件名主体前补 `00` 至 `04` 前缀完成实际排序。
- 保留 `skills/`、`workspace/`、`conversation_history/`，因为它们分别是原文隐含的 skill、文件交接和上下文压缩配套资料。

### 2. 相对路径和复习注释

- `01-agent.mjs` 改为引用 `./tools/00-search.mjs`，`projectDir` 继续指向 lesson 根目录。
- `02-cli.mjs` 改为引用 `./01-agent.mjs`。
- `03-todo-middleware-test.mjs` 继续从 `../tmp.json` 读取实验输入。
- 为 5 个核心入口补充复习型注释，说明示例目的、和相邻阶段的关系、适用场景和依赖边界。
- 未删除原有有效注释；新增注释只补充学习定位。

### 3. 运行脚本

更新 `package.json`：

- `check`：逐个执行 5 个入口的 `node --check`。
- `demo:search`、`demo:agent`、`demo:cli`、`demo:todo`、`demo:context`：对应排序后的入口。
- `test`：指向 `npm run check`，避免保留原来必然失败的占位测试脚本。

没有新增 lesson 内模型工厂或 env helper。模型初始化和根 `.env` 读取已经由超过 3 个 lesson 共享的 `@lessons/shared/model`、`@lessons/shared/env-loader` 提供，按跨 lesson 共享规则继续复用。

## 原文与当前代码的差异

1. 原文直接使用 `ChatOpenAI` 和 `dotenv/config`；当前仓库统一复用 `@lessons/shared/model` 与 `@lessons/shared/env-loader`，以便从仓库根 `.env` 加载配置。
2. 原文示例路径是扁平的 `src/agent.mjs`、`src/cli.mjs` 等；本次不增加目录，只在 basename 前补 `00` 至 `04` 前缀，并在本文映射表保留原文路径。
3. 当前代码比文章片段增加了 `agentConfig.recursionLimit`、模型参数兼容处理和 CLI 事件追踪，这些属于运行稳定性与观测增强，不改变文章的主 Agent 结构。
4. 当前 `researcherSubAgent` 的搜索硬上限为 3 次；原 `skills/web-research/SKILL.md` 曾写着“最多 10 次搜索”，本轮已同步为 3 次，避免 skill 指令与源码约束冲突。
5. `workspace/sources/findings_gdp_top6.md` 和报告产物来自历史调研，混用了第三方数据与媒体口径；其中“以国家统计局官方公布为准”没有被本地运行验证。复习数据流即可，不应把该历史报告当作重新核实后的官方数据结论。
6. `conversation_history/` 是生成的历史上下文归档，不是新的 Agent 能力实现；它用于观察摘要后如何保存会话。

## 公共代码抽离检查

- 本 lesson 内的模型初始化已集中通过 `@lessons/shared/model`，没有重复新建 `src/_shared/model.mjs`。
- 根 `.env` 加载已通过 `@lessons/shared/env-loader` 复用，没有在本 lesson 新建重复 loader。
- schema、examples、prompt block 和搜索格式化函数没有跨多个示例重复到需要 lesson 内抽离的程度；搜索格式化函数只属于 `00-search.mjs` 的工具实现。
- 保留两条编号文件 import：`02-cli.mjs` 引用 `01-agent.mjs`，`01-agent.mjs` 引用 `tools/00-search.mjs`。这是文章原有的 CLI -> Agent -> Tool 调用链，不是为复用演示代码新增的依赖；两个被导入模块都用 `isMain` 守卫直接运行，因此 import 不会触发演示执行。用户明确要求不新增目录，本轮不创建 `_shared/` 兼容层。
- 跨 lesson 检查结论：模型初始化与 env loader 已超过 3 个 lesson 复用，仓库已有共享入口，因此本轮不新增 `lessons/_shared/` 副本。

## 外部服务不可用时的最小复习路径

没有模型 API 时，先执行 `npm run check`，再按 `00 搜索工具 -> 01 主 Agent -> skills/AGENTS.md -> 02 CLI -> workspace` 阅读调用链。没有 Bocha 时，只跳过真实 `demo:search` 和 researcher 的联网步骤；`analyst` 的 QuickJS 机制可以通过源码和历史 `analysis_2023_gdp.md` 静态理解。没有 LangSmith 时，CLI 仍可作为本地事件观测代码阅读，云端 trace 只是不产生。

本次没有新增 fallback 文件，因为文章没有提供本地 fallback，且用户只要求排序整理和后续复习入口。

## 后续复习要注意的坑点

- `FilesystemBackend` 使用 `virtualMode: true` 时，Agent 看到的是 `/workspace/` 虚拟路径；主 Agent 的 `projectDir` 是宿主路径，二者不要混淆。
- `memory` 和 `skills` 参数传入的是虚拟路径；本次保留原目录，因此它们继续指向 lesson 根目录下的资源。
- `researcher` 写完 findings 后应立即停止；否则可能重复搜索或反复更新 todo。
- `editor` 只审阅不改稿，主 Agent 才负责按反馈修订，这体现了角色边界。
- `eval` 适合计算总和、均值、排序和增长率，但它不是数据库或持久化计算服务。
- 上下文压缩测试只覆盖 profile 配置，不代表已经验证实际摘要触发和 `conversation_history` 写入。
- researcher 的搜索上限由主 Agent prompt 和 `web-research/SKILL.md` 共同约束为 3 次；后续修改其中一处时必须同步另一处。

## 自检记录

- `_shared/` 抽离结果：未新增；模型工厂和 env loader 复用仓库级 `@lessons/shared/*`，本 lesson 不需要空置的 `_shared/`。
- lessons 子课程复习文档：通过，根目录仅有 `README.md`、`REVIEW_NOTES.md` 两份复习文档；`AGENTS.md` 是项目指令文件，不属于讲义文档。
- lesson 独立依赖：通过，未在 `lessons/31_deep-research-assistant` 下生成 `node_modules`；依赖规格已存在于 lesson `package.json`，实际安装由根工作区维护。
- 编号示例 import：保留原始调用链例外。`02-cli.mjs -> 01-agent.mjs -> tools/00-search.mjs` 均已通过 import 检查，且 `isMain` 守卫避免导入副作用；详细原因见“公共代码抽离检查”。
- README 依赖分类：已区分语法检查、无需 API Key、需要 Bocha、需要模型 API、可选 LangSmith 和降级复习路径。
- `package.json` / 环境变量说明：已补齐脚本和根目录 `.env` 说明。
- 外部服务降级说明：已补齐；没有新增 fallback，因此没有“非原文示例”文件需要标注。
- 原文注释保留：通过；没有移动或删除源码注释，只新增复习定位注释。
- 数据库边界：本课不涉及数据库；没有执行 Docker、数据库或持久化服务验证。
- `node --check`：通过；5 个排序后的 `.mjs` 入口均已检查，`npm run check` 成功。
- 无模型配置示例：通过；`npm run demo:context` 成功输出 `undefined` 和覆盖后的 `8000`，未调用模型。
