# Skills Test Run

## 测试任务

读取 `index.js`。如果当前项目不存在 `index.js`，则读取 Agent 入口文件或最接近的项目入口文件。

当前项目的回退顺序：

1. `index.js`
2. `src/index.js`
3. `server.js`
4. `package.json`
5. `AGENT.md`

## 执行流程

Agent 必须使用 Skills 完整执行一遍分析流程：

1. 使用 `prompt-analysis.md` 输出 prompt 分析结果。
2. 使用 `file-structure-analyzer.md` 输出结构分析结果。
3. 使用 `code-explainer.md` 输出入口文件或相关文件解释。
4. 使用 `node-runtime.md` 判断是否存在可运行入口和运行命令。
5. 执行只读验证任务，不修改业务逻辑。
6. 使用 `execution-trace.md` 输出执行链路 trace。

## 示例输出格式

```markdown
## Prompt 分析结果

- 用户目标：
- 明确约束：
- 成功条件：
- 风险或歧义：

## 结构分析结果

- Prompt 层：
- Agent 层：
- Tool 层：
- RAG 层：
- Runtime 层：
- 入口文件判断：

## 代码理解结果

- 文件角色：
- 主流程：
- 关键交互点：
- 数据流：

## Runtime 判断

- 包管理器：
- 可用脚本：
- 推荐运行方式：
- 环境变量要求：

## 执行链路 Trace

### Input

### Interpretation

### Tool Calls

### Observations

### Decisions

### Output

### Flow Diagram
```

## 当前项目验证说明

如果未找到 `index.js`、`src/index.js` 或 `server.js`，本测试任务应以 `package.json` 和 `AGENT.md` 作为入口判断依据：

- `package.json` 用于判断 Node.js workspace、包管理器和可用脚本。
- `AGENT.md` 用于判断 Agent 级项目规则入口。

该测试任务只验证 Skills 流程是否完整，不要求实际启动项目。
