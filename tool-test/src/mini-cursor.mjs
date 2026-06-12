import "dotenv/config";
import chalk from "chalk"; // 给控制台输入添加背景色
import { ChatOpenAI } from "@langchain/openai";
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
} from "./all-tools.mjs";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
  // 尝试添加这个配置，强制非流式，有时能触发正确的工具调用
  //   streaming: false,
});

const tools = [
  readFileTool,
  writeFileTool,
  executeCommandTool,
  listDirectoryTool,
];

// 绑定工具到模型
const modelWithTools = model.bindTools(tools);

// Agent 执行函数

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

      // --- 调试：打印原始响应 ---
      // console.log(chalk.gray(`🔍 原始响应:`, JSON.stringify(response, null, 2)));

      // --- 1. 处理空响应 ---
      if (
        !response.content &&
        (!response.tool_calls || response.tool_calls.length === 0)
      ) {
        console.log(chalk.red(`⚠️ AI 返回了空消息。终止。`));
        break;
      }

      messages.push(response);

      // --- 2. 标准工具调用 (最理想) ---
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

      // --- 3. AI 偷懒了：输出文本/Markdown (重点修复这里) ---
      // --- 情况 B: AI 偷懒了，返回了包含 JSON 的文本 ---
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

            // 1. 处理命令执行
            if (action.command && !action.filePath) {
              const result = await executeCommandTool.invoke({
                command: action.command,
                workingDirectory: action.workingDirectory,
              });
              messages.push(new HumanMessage(`命令执行结果: ${result}`));
              executedCount++;
            }
            // 2. 处理文件写入
            else if (action.filePath && action.content !== undefined) {
              const result = await writeFileTool.invoke({
                filePath: action.filePath,
                content: action.content,
              });
              messages.push(new HumanMessage(`文件写入结果: ${result}`));
              executedCount++;
            }
            // 3. 处理目录列出
            else if (
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

      // --- 4. 真的结束了 ---
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
