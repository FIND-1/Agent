# 30_deepagents_test 项目记忆

## 项目概览

这是一个用于学习和验证 LangChain `createAgent`、middleware 以及 deepagents 能力的 Node.js ESM 示例目录，不是生产级 Agent Framework。

## 技术栈与依赖

- Node.js 22+
- ESM（`package.json` 中配置了 `"type": "module"`）
- `langchain`
- `deepagents`
- `@lessons/shared`

## 模型配置

- 示例通过 `@lessons/shared/model` 的 `createChatModel()` 创建 ChatModel。
- 环境变量由 `@lessons/shared/env-loader` 统一从仓库根目录 `.env` 加载。
- 当前根 `.env` 使用 `MODEL_NAME` 和 `OPENAI_BASE_URL` 配置模型；API Key 只允许从环境变量读取，不能写入代码或记忆文件。
- `memory-agent.mjs` 会在创建模型前校验 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MODEL_NAME` 是否存在。

## 示例入口

- `src/middleware-test.mjs`：日志统计、模型调用前追加上下文、敏感词拦截。
- `src/middleware-test2.mjs`：通过 middleware 注册工具并包装工具调用；当前属于实验示例，运行前需先检查源码语法。
- `src/deepagents/filesystem-agent.mjs`：虚拟文件系统、文件读写权限和拒绝规则。
- `src/deepagents/memory-agent.mjs`：`createMemoryMiddleware` 长期记忆示例，也是本 lesson 的主要入口。
- `src/deepagents/skills-agent.mjs`：加载 `.agents/skills` 下的 skill，生成 Excalidraw 流程图。
- `src/deepagents/subagent-agent.mjs`：通过 `createSubAgentMiddleware` 委派数学解题、讲解和出题子 Agent。

## memory-agent 约定

- 代码中的虚拟工作区实际是 `src/deepagents/workspace-memory`。
- 对 Agent 暴露的项目记忆路径是 `/AGENTS.md`，对应项目说明、技术栈、架构和仓库约定。
- 对 Agent 暴露的个人偏好路径是 `/memory/preferences.md`，对应语言、包管理器和回答风格等偏好。
- 项目事实写入 `AGENTS.md`，个人偏好写入 `memory/preferences.md`，两者不能混写。
- 用户明确要求“记住”时，Agent 应立即使用 `edit_file` 更新对应记忆文件。
- 脚本会依次验证已有项目记忆、保存包管理器偏好、保存入口脚本路径，并打印两个记忆文件的内容。

## 其他约定

- 所有 deepagents 文件系统示例使用虚拟根路径 `/`；实际文件由 backend 映射到 lesson 内的工作区。
- skill 示例依赖 `.agents/skills/excalidraw-diagram-generator/SKILL.md`；缺少该文件时，先按 `skills-agent.mjs` 的提示安装 skill。
- 不在本文件中保存 API Key、Token、密码或 `.env` 的具体敏感值。
