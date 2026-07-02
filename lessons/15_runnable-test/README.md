# Runnable：把写逻辑变成组装 chain

本项目对应 `SUMMARY_RULES.txt` 中的 Runnable 博文，核心目标不是单独记住某一个 Runnable API，而是理解 LangChain 如何把 `PromptTemplate`、`ChatOpenAI`、`OutputParser` 和普通函数统一到 Runnable 接口下：先声明 chain 的结构，再通过 `invoke`、`batch`、`stream` 等统一入口执行。

## 1. 为什么需要 Runnable

没有 Runnable 时，一个典型 LLM 流程通常要手动拆成多步：

- 用 `PromptTemplate.format()` 把变量填进 prompt。
- 调用模型的 `invoke()` 得到回复。
- 再把模型输出交给 `OutputParser` 解析。

这类过程式写法在 demo 里可以接受，但链路变长后会有几个问题：

- 每个步骤都要手动调用，业务逻辑和编排逻辑混在一起。
- 很难在同一条链上切换单次调用、批量调用和流式调用。
- 普通函数、prompt、模型、parser 的接口不一致，组合成本较高。
- 分支、路由、循环、保留原始输入等控制逻辑容易散落在业务代码里。

Runnable 和 LCEL（LangChain Expression Language）主要解决这些编排问题：把“写逻辑”变成“组装 chain”。

## 2. 核心学习路径

建议按下面顺序阅读和运行源码：

0. `@lessons/shared/model`
   - 统一复用项目级 `ChatOpenAI` 初始化和根目录 `.env`。
   - 这部分不是 Runnable 主线，直接使用共享包是为了让调用模型的示例更聚焦。
   - 如果模型服务地址、模型名或 temperature 需要变化，优先改项目级共享模型入口或调用时传入覆盖参数。

1. `src/00-before.mjs`
   - 对比用：不使用 LCEL，手动执行 `format -> model -> parser`。
   - 重点理解旧写法的问题：每一步都要显式调用，下游逻辑需要知道上游返回值形态。

2. `src/01-runnable-sequence.mjs`
   - 使用 `pipe()` 或 `RunnableSequence.from()` 把 prompt、model、parser 组装成顺序 chain。
   - 重点理解：`pipe()` 返回的也是 RunnableSequence，和显式数组声明本质一致。

3. `src/02-runnable-lambda.mjs`
   - 使用 `RunnableLambda.from()` 把普通函数包装成 Runnable。
   - 重点理解：普通数据转换函数也可以进入 LCEL chain。

4. `src/03-runnable-map.mjs`
   - 使用 `RunnableMap.from()` 并行执行多个 Runnable。
   - 同一份输入可以同时做数学计算和 prompt 格式化，结果按对象字段汇总。

5. `src/04-runnable-branch.mjs`
   - 使用 `RunnableBranch.from()` 表达 `if / else if / else`。
   - 条件从上到下匹配，命中第一个条件后执行对应分支。

6. `src/05-router-runnable.mjs`
   - 文章里讲的是 `RouterRunnable`，用于根据 key 选择要执行的 runnable。
   - 当前项目安装的 `@langchain/core` 没有导出 `RouterRunnable`，因此本示例用 `RunnableLambda + routes` 表达同样的 switch-case 思路。

7. `src/06-runnable-passthrough.mjs`
   - 使用 `RunnablePassthrough.assign()` 保留原始对象，同时追加派生字段。
   - 重点理解：在 chain 中不要轻易丢掉原始上下文。

8. `src/07-runnable-each.mjs`
   - 使用 `RunnableEach` 对数组里的每个元素应用同一条 chain。
   - 适合把单条处理逻辑扩展到列表输入。

9. `src/08-runnable-pick.mjs`
   - 使用 `RunnablePick` 从对象里挑选最终需要暴露的字段。
   - 适合隐藏中间字段，让输出面更稳定。

10. `src/09-runnable-with-message-history.mjs`
    - 使用 `RunnableWithMessageHistory` 给 chain 加上按 `sessionId` 隔离的对话历史。
    - 重点理解：memory 是包在 chain 外层的能力，不是模型本身自动记住。

## 3. API 速查

| API | 解决的问题 | 典型文件 |
| --- | --- | --- |
| `RunnableSequence` / `pipe()` | 顺序执行多个 Runnable | `01-runnable-sequence.mjs` |
| `RunnableLambda` | 把普通函数变成 Runnable | `02-runnable-lambda.mjs` / `05-router-runnable.mjs` |
| `RunnableMap` | 同一输入并行经过多个 Runnable | `03-runnable-map.mjs` |
| `RunnableBranch` | 条件分支，类似 `if / else` | `04-runnable-branch.mjs` |
| 路由表 + `RunnableLambda` | 根据 key 选择处理链，类似 `switch case` | `05-router-runnable.mjs` |
| `RunnablePassthrough` | 原样传递输入或保留原始对象 | `06-runnable-passthrough.mjs` |
| `RunnableEach` | 对数组每个元素执行同一条 chain | `07-runnable-each.mjs` |
| `RunnablePick` | 从对象输出中选择字段 | `08-runnable-pick.mjs` |
| `RunnableWithMessageHistory` | 给 chain 接入对话历史 | `09-runnable-with-message-history.mjs` |

## 4. 概念关系

```text
原始输入
  -> PromptTemplate / 普通函数 / 条件判断
  -> RunnableSequence 顺序组装
  -> RunnableMap 并行派生
  -> RunnableBranch / 路由表选择分支
  -> RunnablePassthrough 保留上下文
  -> RunnablePick 收敛输出字段
  -> invoke / batch / stream 统一执行
```

可以把它理解为四层：

- 基础层：`invoke`、`batch`、`stream`，负责统一执行方式。
- 顺序层：`pipe()` 和 `RunnableSequence`，负责把多个步骤串成一条链。
- 控制层：`RunnableMap`、`RunnableBranch`、路由表和 `RunnableEach`，负责并行、分支、路由和循环。
- 上下文层：`RunnablePassthrough`、`RunnablePick`、`RunnableWithMessageHistory`，负责保留、裁剪和注入上下文。

## 5. 安装与环境变量

安装依赖：

```bash
pnpm install
```

`.env` 需要提供：

```bash
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
```

只有 `00-before.mjs`、`01-runnable-sequence.mjs` 和 `09-runnable-with-message-history.mjs` 会真实调用模型；其余示例可以直接本地运行。

## 6. 运行示例

完整复习顺序：

```bash
node --check src/00-before.mjs
node --check src/01-runnable-sequence.mjs
node --check src/02-runnable-lambda.mjs
node --check src/03-runnable-map.mjs
node --check src/04-runnable-branch.mjs
node --check src/05-router-runnable.mjs
node --check src/06-runnable-passthrough.mjs
node --check src/07-runnable-each.mjs
node --check src/08-runnable-pick.mjs
node --check src/09-runnable-with-message-history.mjs
```

`node --check` 只做语法检查，不会调用模型。真正运行调用模型的脚本前，请先确认 `.env` 可用。

Runnable 基础：

```bash
node src/00-before.mjs
node src/01-runnable-sequence.mjs
node src/02-runnable-lambda.mjs
```

并行、分支与路由：

```bash
node src/03-runnable-map.mjs
node src/04-runnable-branch.mjs
node src/05-router-runnable.mjs
```

上下文保留、循环与字段选择：

```bash
node src/06-runnable-passthrough.mjs
node src/07-runnable-each.mjs
node src/08-runnable-pick.mjs
```

带历史记录的 chain：

```bash
node src/09-runnable-with-message-history.mjs
```

## 7. 常见报错

- `OPENAI_API_KEY` 相关错误：`.env` 未配置或 Key 不可用。可以先运行 `node --check` 和 `02` 到 `08` 这些不调用模型的示例。
- `RouterRunnable` 导入失败：当前 `@langchain/core` 版本没有导出这个类，本项目使用 `RunnableLambda + routes` 保留路由概念。
- `RunnableBranch` 分支结果不符合预期：分支条件是从上到下匹配，正数分支放在偶数分支前时，`4` 会先命中正数，而不会走偶数分支。
- `RunnableMap` 输出里出现 `StringPromptValue`：这是 `PromptTemplate` 的正常输出形态，需要交给模型时可继续 pipe 到模型。

## 8. 当前项目注意事项

- 当前示例统一围绕 Runnable / LCEL 展开，文件顺序保持文章递进关系。
- 所有示例文件必须保留编号前缀，便于按顺序复习。
- 编号示例之间不要互相 import，避免运行一个示例时触发另一个示例的顶层代码。
- 模型初始化统一从 `@lessons/shared/model` 导入；不要再创建 lesson 内只做转发的 `_shared/model.mjs`，避免浪费阅读路径。
- `05-router-runnable.mjs` 是对文章中 `RouterRunnable` 小节的兼容实现，不代表当前版本存在同名导出。
- `00`、`01`、`09` 会调用模型；`02` 到 `08` 是不依赖外部模型服务的本地复习示例。

## 9. 复习重点

- Runnable 的核心价值是统一接口：prompt、model、parser 和普通函数都能进入同一条 chain。
- LCEL 的核心写法是声明 chain，而不是手动写每一步调用逻辑。
- `pipe()` 适合线性流程，`RunnableMap` 适合并行派生，`RunnableBranch` 适合条件选择。
- `RunnablePassthrough` 适合保留原始上下文，`RunnablePick` 适合收敛最终输出字段。
- `RunnableWithMessageHistory` 通过外层包装给 chain 增加 memory，真实项目要注意按用户或会话隔离历史。
- 示例文件顶部的“复习重点”注释必须保留，用来说明当前示例解决的问题和相对前序示例的增量。
