# Skills Policy

## 强制 Skill 绑定行为

当前项目中的 Codex Agent 行为必须绑定到 `skills/` 目录下的 Skill 流程。

## 绑定规则

- 所有 prompt 修改必须先经过 `prompt-analysis.md`。
- 所有代码修改必须先经过 `code-explainer.md`。
- 所有运行必须符合 `node-runtime.md`。
- 所有执行必须记录 `execution-trace.md`。
- 所有 `lessons/*` 学习代码包整理必须遵循 `lesson-summary-standard.md`。
- 不允许跳过 Skills 流程。

## 任务类型约束

### Prompt 或规范修改

当任务涉及 prompt、Agent 指令、规则、策略、Skill 文档或输出格式时：

1. 先使用 `prompt-analysis.md` 分析输入层级、约束和冲突。
2. 再使用 `file-structure-analyzer.md` 定位相关文档。
3. 修改前确认不会影响业务代码。
4. 修改后使用 `execution-trace.md` 记录变更原因和结果。

### 代码修改

当任务涉及 `.js`、`.mjs`、`.ts`、`.tsx`、配置文件或运行脚本时：

1. 先使用 `code-explainer.md` 解释相关文件职责。
2. 再确定最小修改范围。
3. 修改后根据 `node-runtime.md` 判断是否需要运行测试、构建或脚本。
4. 使用 `execution-trace.md` 记录修改、验证和风险。

### Lesson 学习代码包整理

当任务涉及整理、重排、总结或修复 `lessons/*` 目录下的学习代码包时：

1. 先读取 `lesson-summary-standard.md`。
2. 以 `lessons/14_prompt-template-test` 的 README、REVIEW_NOTES、编号文件和 `_shared` 结构为默认标准。
3. 确保示例文件使用 `00-`、`01-`、`02-` 这类编号前缀。
4. README 必须包含核心学习路径、API 速查、运行示例、常见报错、项目注意事项和复习重点。
5. 每个编号示例文件顶部必须保留“复习重点”注释。
6. 模型初始化必须直接从 `@lessons/shared/model` 导入，不要创建只做转发的 lesson 内 `_shared/model.mjs`。
7. 未经用户明确允许不得删除文件；用户允许重新排序清理时，旧的未编号重复文件可以删除，但必须确认编号文件、README 和 package.json 已同步。

### 运行命令

当任务涉及运行 Node.js、pnpm、npm、Vite、LangChain、MCP、RAG、Memory 或 Agent 示例时：

1. 先读取 `package.json` 或相关入口文件。
2. 使用 `node-runtime.md` 判断命令形式。
3. 明确运行目的、依赖环境变量和可能副作用。
4. 运行后记录关键输出，不把无关日志作为结论。

## 禁止行为

- 禁止在未读取 Skills 入口规则时直接修改代码。
- 禁止在未理解相关代码逻辑时批量重构。
- 禁止在未判断 runtime 的情况下盲目运行命令。
- 禁止省略执行 trace。
- 禁止为了满足流程而虚构读取、运行或验证结果。

## Code Generation Policy (Ponytail Mode)

This project enforces an additional constraint layer for all code generation tasks.

## Dual Mode Execution Rule

This policy operates in STRICT MODE by default.

However, if Dual Mode Controller is active:

- NORMAL MODE overrides abstraction restrictions
- STRICT MODE enforces full Ponytail constraints

### Purpose
Prevent over-engineering during AI code generation.

---

### Core Rules (must follow before writing code)

1. Prefer minimal implementation over abstraction
2. Do not create new files unless strictly required
3. Do not introduce new hooks/services/utils unless reused ≥ 2 times
4. Prefer inline logic over extracted functions
5. Prefer modifying existing code instead of restructuring
6. Prefer native APIs over external dependencies

---

### Decision Gate (mandatory before coding)

Before modifying or writing code, always evaluate:

- Can this be solved inside existing file?
- Can this be implemented inline?
- Does framework/native API already solve this?

If YES → DO NOT create new structure

---

### Anti-overengineering rules

By default forbid:

- new hook extraction
- new service layer
- new utility modules (single-use)
- unnecessary folder splitting
- premature architectural refactoring
