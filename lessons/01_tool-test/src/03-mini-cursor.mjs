/**
 * 示例 03：mini cursor —— 把工具串成能自己干活的 agent
 *
 * 对应原文结尾预告「简易版 cursor」。
 *
 * 与示例 01 的差异：
 *   - 工具集从 2 个扩展到 4 个（读 / 写 / 执行命令 / 列目录），来自 src/_shared/all-tools.mjs；
 *   - 加了 maxIterations 上限，避免死循环；
 *   - 加了「模型偷懒输出代码块」的兜底：用正则从 Markdown 代码块里抽 JSON 再执行；
 *   - SystemMessage 里写死操作系统和命令习惯（Windows 用 rmdir / dir），
 *     因为模型默认会按 Linux 习惯生成 rm -rf、ls。
 *
 * 风险：execute_command 无白名单，会真实执行 shell 命令并覆盖文件；
 * 任务里包含 rmdir /s /q react-todo-app 和 npm run dev -- --host，
 * 直接运行会删除并重建 react-todo-app 并启动 Vite 占用端口。
 *
 * 依赖：OPENAI_API_KEY / OPENAI_BASE_URL / MODEL_NAME；还需要网络（create-vite / npm install）。
 * 运行：node src/03-mini-cursor.mjs
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import chalk from "chalk";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  executeCommandTool,
  listDirectoryTool,
  readFileTool,
  writeFileTool,
} from "./_shared/all-tools.mjs";

const model = createChatModel();

const tools = [
  readFileTool,
  writeFileTool,
  executeCommandTool,
  listDirectoryTool,
];

const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 30) {
  const systemPrompt = `你是一个自动化运维助手。
当前操作系统: **Windows** (重要!)
当前工作目录: ${process.cwd()}

可用工具：
1. execute_command: 执行 shell 命令
2. write_file: 写入文件
3. read_file: 读取文件
4. list_directory: 列出目录

**关键规则**：
- **必须使用 Windows 命令**：
  - 删除文件夹请使用: 'rmdir /s /q 目录名' 或 'del /f /s /q 目录名' (不要用 rm -rf)
  - 列出目录请使用: 'dir' (不要用 ls)
  - 路径分隔符使用反斜杠 '\\' 或双反斜杠 '\\\\'
- 禁止输出 Markdown 代码块。
- **必须直接调用工具**。
- 如果遇到“系统找不到指定的文件”，请检查路径是否正确。
- 如果必须输出代码内容，请直接调用 write_file 工具。`;

  // 然后在 messages 数组中使用
  const messages = [new SystemMessage(systemPrompt), new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`\n⏳ 第 ${i + 1} 轮思考...`));

    try {
      const response = await modelWithTools.invoke(messages);

      if (
        !response.content &&
        (!response.tool_calls || response.tool_calls.length === 0)
      ) {
        console.log(chalk.red(`⚠️ AI 返回了空消息。终止。`));
        break;
      }

      messages.push(response);

      // 正常路径：模型真的产出了 tool_calls。
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(chalk.cyan(`🛠️ 检测到原生工具调用...`));
        for (const toolCall of response.tool_calls) {
          const foundTool = tools.find((t) => t.name === toolCall.name);
          if (foundTool) {
            console.log(`   -> 执行: ${toolCall.name}`);
            const toolResult = await foundTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                content: toolResult,
                tool_call_id: toolCall.id,
              }),
            );
          }
        }
        continue;
      }

      // 兜底分支：模型「偷懒」,没产出 tool_calls,而是直接输出 Markdown 代码块。
      // 对一些不熟悉工具调用的模型有用,正规走 tool_calls 时不会触发。
      const content = response.content;
      if (typeof content === "string" && content.includes("```")) {
        console.log(
          chalk.yellow(`⚠️ 检测到 AI 返回了代码块，尝试提取 JSON...`),
        );

        // 匹配所有 ```json 或 ``` 开头的代码块
        const codeBlockRegex = /```json?\n([\s\S]*?)\n```/g;
        let match;
        let executedCount = 0;

        while ((match = codeBlockRegex.exec(content)) !== null) {
          const jsonStr = match[1].trim();

          try {
            const action = JSON.parse(jsonStr);
            console.log(
              `   -> 解析到操作: ${action.command || action.filePath}`,
            );

            if (action.command && !action.filePath) {
              const result = await executeCommandTool.invoke({
                command: action.command,
                workingDirectory: action.workingDirectory,
              });
              messages.push(new HumanMessage(`命令执行结果: ${result}`));
              executedCount++;
            } else if (action.filePath && action.content !== undefined) {
              const result = await writeFileTool.invoke({
                filePath: action.filePath,
                content: action.content,
              });
              messages.push(new HumanMessage(`文件写入结果: ${result}`));
              executedCount++;
            } else if (
              action.command === "list_directory" ||
              (action.directoryPath && !action.content)
            ) {
              const result = await listDirectoryTool.invoke({
                directoryPath: action.directoryPath || action.workingDirectory,
              });
              messages.push(new HumanMessage(`目录列表结果: ${result}`));
              executedCount++;
            }
          } catch (e) {
            console.log("JSON 解析失败，跳过:", e.message);
          }
        }

        if (executedCount > 0) {
          continue; // 成功执行了，进入下一轮
        }
      }

      // 拿到最终自然语言回复，结束。
      console.log(`\n✨ 任务结束: ${response.content}\n`);
      return response.content;
    } catch (error) {
      console.error(chalk.red(`\n❌ 调用模型出错: ${error.message}`));
      break;
    }
  }
}

const case1 = `创建一个功能丰富的 React TodoList 应用。
请严格按照以下步骤顺序执行，**严禁跳步**：

**第一步：环境准备 (非交互式)**
1. 如果目录 "react-todo-app" 存在，请使用强制删除命令彻底清空它 (例如 Windows下使用 'rmdir /s /q react-todo-app' 或 'del /f /s /q')。如果提示文件被占用，请忽略错误继续。
2. 创建项目：运行 'npx create-vite react-todo-app --template react-ts --force'。
   - 注意：如果提示选择目录，请确保使用参数跳过交互，或者确保目录已清空。
3. 安装依赖：进入目录并运行 'npm install'。

**第二步：编写核心代码 (必须在启动服务器前完成)**
1. 修改 'src/App.tsx'：
   - 覆盖原有内容，实现完整的 TodoList 功能（添加、删除、编辑、完成状态切换）。
   - 实现分类筛选（全部/进行中/已完成）。
   - 实现 localStorage 数据持久化。
2. 修改 'src/App.css'：
   - 添加渐变背景（蓝到紫）。
   - 添加卡片阴影、圆角、悬停效果。

**第三步：验证与启动**
1. 运行 'list_directory' 检查 'src/App.tsx' 是否已被修改（确认代码已写入）。
2. **最后一步**：运行 'npm run dev -- --host' 启动服务器。
   - 启动后任务结束。`;

try {
  await runAgentWithTools(case1);
} catch (error) {
  console.error(`\n❌ 错误: ${error.message}\n`);
}



