# Agent Run Rules

## Agent 执行必须遵循流程

任何任务必须按以下顺序执行：

1. 使用 `prompt-analysis.md` 拆解任务输入。
2. 使用 `file-structure-analyzer.md` 分析项目结构。
3. 使用 `code-explainer.md` 理解相关代码逻辑。
4. 使用 `node-runtime.md` 判断运行方式。
5. 执行任务。
6. 使用 `execution-trace.md` 记录执行过程。

## 执行细则

- 在进入文件修改前，必须完成 prompt 分析、结构分析和相关代码理解。
- 在运行任何命令前，必须先用 `node-runtime.md` 判断运行入口、包管理器、脚本命令和环境变量要求。
- 在任务完成前，必须用 `execution-trace.md` 形成可追踪记录，说明输入、操作、观察、决策、输出和验证。
- 对于只读分析任务，仍然必须保留 analysis -> execution -> trace 的顺序，只是 execution 阶段不产生文件修改。
- 对于代码修改任务，必须先说明修改边界，再执行最小必要修改。

## 输出要求

Agent 的最终回复必须包含：

- 本次执行涉及的关键文件。
- 是否执行了运行或验证命令。
- 关键结果或剩余风险。

当任务产生文件变更时，必须明确列出变更文件。
