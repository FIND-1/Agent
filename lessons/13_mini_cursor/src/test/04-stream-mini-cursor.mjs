/**
 * 流式版 mini cursor。
 *
 * 本文件对应文章后半段：普通 tool calling 要等完整 AIMessage 返回后
 * 才能看到 write_file 的内容；流式版本可以在 tool 参数还在生成时，
 * 用 JsonOutputToolsParser 解析 tool_call_chunks，并把新增内容打印出来。
 *
 * 复习主线：
 * 1. stream 返回的是 AIMessageChunk，不是完整 AIMessage。
 * 2. 用 concat 把 chunk 拼成完整 AIMessage，最后再放入 memory。
 * 3. tool_call_chunks 不是完整 JSON，用 JsonOutputToolsParser 累积解析。
 * 4. 流式预览只负责展示，真正执行工具仍然使用 fullAIMessage.tool_calls。
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
import { pathToFileURL } from "node:url";
import chalk from "chalk";
import {
  executeCommandTool,
  listDirectoryTool,
  readFileTool,
  writeFileTool,
} from "./03-all-tools.mjs";

const model = createChatModel();

const tools = [readFileTool, writeFileTool, executeCommandTool, listDirectoryTool];
const modelWithTools = model.bindTools(tools);

function getToolName(toolCall) {
  return toolCall.name || toolCall.type;
}

function getToolPreviewKey(toolCall, index) {
  return toolCall.id || toolCall.args?.filePath || `${getToolName(toolCall)}-${index}`;
}

async function addSystemPrompt(history) {
  await history.addMessage(
    new SystemMessage(`你是一个项目管理助手，必须通过工具完成文件和命令任务。

当前工作目录: ${process.cwd()}

可用工具：
1. read_file: 读取文件
2. write_file: 写入文件
3. execute_command: 执行命令，支持 workingDirectory
4. list_directory: 列出目录

重要规则：
- 如果 execute_command 使用 workingDirectory，command 里不要再写 cd。
- 写入 React 组件文件时，如果项目已有对应 CSS 文件，请保留或补充 CSS import。
- 需要创建或修改文件时，直接调用 write_file，不要只输出 Markdown 代码块。
- 启动 dev server 这类长时间命令时，可以设置 detached: true。`),
  );
}

function printTextChunk(chunk) {
  if (!chunk.content) return;

  if (typeof chunk.content === "string") {
    process.stdout.write(chunk.content);
    return;
  }

  process.stdout.write(JSON.stringify(chunk.content));
}

async function previewToolCallChunks(fullAIMessage, parser, printedLengths) {
  let parsedTools;

  try {
    parsedTools = await parser.parseResult([{ message: fullAIMessage }]);
  } catch {
    // 流式片段经常不是完整 JSON，解析失败说明还需要继续等待后续 chunk。
    return false;
  }

  if (!parsedTools?.length) return false;

  parsedTools.forEach((toolCall, index) => {
    const toolName = getToolName(toolCall);

    // 本示例重点展示 write_file 的 content 增量，因为写代码时最能体现打字机效果。
    if (toolName !== "write_file" || !toolCall.args?.content) return;

    const key = getToolPreviewKey(toolCall, index);
    const currentContent = String(toolCall.args.content);
    const previousLength = printedLengths.get(key) ?? 0;

    if (!printedLengths.has(key)) {
      console.log(
        chalk.bgBlue(
          `\n[工具调用预览] write_file("${toolCall.args.filePath}") - 开始流式生成\n`,
        ),
      );
    }

    if (currentContent.length > previousLength) {
      process.stdout.write(currentContent.slice(previousLength));
      printedLengths.set(key, currentContent.length);
    }
  });

  return true;
}

async function executeToolCalls(fullAIMessage, history) {
  for (const toolCall of fullAIMessage.tool_calls || []) {
    const foundTool = tools.find((tool) => tool.name === toolCall.name);

    if (!foundTool) {
      await history.addMessage(
        new ToolMessage({
          content: `未找到工具: ${toolCall.name}`,
          tool_call_id: toolCall.id,
        }),
      );
      continue;
    }

    console.log(chalk.cyan(`\n[工具执行] ${toolCall.name}`));
    const result = await foundTool.invoke(toolCall.args);

    await history.addMessage(
      new ToolMessage({
        content: result,
        tool_call_id: toolCall.id,
      }),
    );
  }
}

export async function runAgentWithTools(query, maxIterations = 30) {
  const history = new InMemoryChatMessageHistory();

  await addSystemPrompt(history);
  await history.addMessage(new HumanMessage(query));

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`\n第 ${i + 1} 轮：开始流式思考\n`));

    const messages = await history.getMessages();
    const rawStream = await modelWithTools.stream(messages);
    const toolParser = new JsonOutputToolsParser();
    const printedLengths = new Map();
    let fullAIMessage = null;
    let hasToolPreview = false;

    for await (const chunk of rawStream) {
      // 关键点 1：stream 给的是 AIMessageChunk，需要不断 concat。
      fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;

      // 关键点 2：边拼接边尝试解析 tool_call_chunks，用于流式预览工具参数。
      const didPreview = await previewToolCallChunks(fullAIMessage, toolParser, printedLengths);
      hasToolPreview = hasToolPreview || didPreview;

      if (!hasToolPreview) {
        printTextChunk(chunk);
      }
    }

    if (!fullAIMessage) {
      console.log(chalk.yellow("模型没有返回任何内容，任务结束。"));
      return "";
    }

    // 关键点 3：只有完整 AIMessage 才适合放回 memory，供下一轮模型继续推理。
    await history.addMessage(fullAIMessage);
    console.log(chalk.green("\n完整 AIMessage 已写入历史"));

    if (!fullAIMessage.tool_calls?.length) {
      console.log(chalk.green("\nAI 没有继续请求工具，任务结束。\n"));
      return fullAIMessage.content;
    }

    // 关键点 4：工具执行使用完整 tool_calls，不使用流式预览里的临时解析结果。
    await executeToolCalls(fullAIMessage, history);
  }

  const finalMessages = await history.getMessages();
  return finalMessages.at(-1)?.content || "";
}

const case1 = `创建一个功能丰富的 React TodoList 应用：

1. 创建项目：pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx，实现完整功能的 TodoList：
   - 添加、删除、编辑、标记完成
   - 分类筛选（全部/进行中/已完成）
   - 统计信息显示
   - localStorage 数据持久化
3. 添加复杂样式：
   - 渐变背景
   - 卡片阴影、圆角
   - hover 效果
   - 添加/删除时的过渡动画
4. 列出目录确认文件已生成

注意：
- 使用 pnpm。
- 如果需要安装依赖，请在 workingDirectory 中指定项目目录，不要在 command 里写 cd。
- 启动开发服务器时使用 detached: true。`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // TODO:
  // - 当前 demo 会真实创建文件、安装依赖并可能启动 dev server，运行前确认工作目录。
  // - 可以补一个更轻量的 case，只写入临时文件，用来单独观察 write_file 参数流式打印。
  // - 可以把 generated project 的输出目录限制到 _playground，避免复习时污染根目录。
  try {
    await runAgentWithTools(case1);
  } catch (error) {
    console.error(`\n错误: ${error.message}\n`);
  }
}



