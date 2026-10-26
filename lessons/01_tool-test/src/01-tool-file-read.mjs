/**
 * 示例 01：第一个 tool —— 让模型自己读文件、写文件
 *
 * 对应原文「接下来开发 tool」。
 *
 * 本示例演示 tool 调用链路：
 *   tool() 定义工具 -> bindTools 把工具说明书交给模型 ->
 *   模型返回 tool_calls（不是执行结果）-> 应用侧找到同名工具并 invoke ->
 *   用 ToolMessage 把结果回填 messages（必须带 tool_call_id）-> 让模型给出最终回复。
 *
 * 与示例 00 相比，多了：tool / bindTools / 四种消息 / ToolMessage 回填。
 *
 * 依赖：OPENAI_API_KEY / OPENAI_BASE_URL / MODEL_NAME
 * 副作用：会把模型输出写入 src/tool-file-write.mjs（运行产物，下次运行会被覆盖）。
 * 运行：node src/01-tool-file-read.mjs
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { tool } from "@langchain/core/tools";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
  AIMessage,
} from "@langchain/core/messages";
import fs from "node:fs/promises";
import { z } from "zod";

const model = createChatModel({
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
});

// tool() 接收 函数体 + name/description/zod schema，schema 决定模型能生成哪些参数。
const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(
      `  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`,
    );
    return `文件内容:\n${content}`;
  },
  {
    name: "read_file",
    description:
      "用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

const writeFileTool = tool(
  async ({ filePath, content }) => {
    await fs.writeFile(filePath, content);
    console.log(`[工具调用] write_file("${filePath}") - 成功写入 ${content.length} 字节`);
    return `文件内容:\n${content}`;
  },
  {
    name: "write_file",
    description: "用此工具来写入文件内容。当用户要求写入文件、修改文件、保存文件时，调用此工具。输入文件路径和要写入的内容。",
    schema: z.object({
      filePath: z.string().describe("要写入的文件路径"),
      content: z.string().describe("要写入的内容"),
    }),
  },
);

const tools = [readFileTool, writeFileTool];

// bindTools 只是把工具的 name/description/schema 告知模型，并不会自动执行工具。
const modelWithTools = model.bindTools(tools);

const messages = [
  new SystemMessage(`你是一个代码助手，必须严格按照以下步骤执行：

**严格的工作流程（必须遵守）：**
1. 当用户要求读取文件时，**必须调用 read_file 工具**。
2. 当 read_file 工具返回内容后，**必须调用 write_file 工具**将内容写入指定文件。
3. 写入成功后，返回"文件已成功写入"。

**禁止行为：**
- 不要在工具调用之外直接输出文件内容或成功消息
- 必须通过工具执行实际操作

可用工具：
- read_file: 读取文件内容
- write_file: 写入文件内容（参数：filePath, content）
`),
  new HumanMessage("请读取 src/01-tool-file-read.mjs 文件内容并解释代码, 然后将打印的结果写入到 src/tool-file-write.mjs 文件中"),
];

// 手工 tool 循环：示例 01 顺序执行（for 逐条调），便于逐条观察入参和返回值；
// 04-02 / 04-03 同形状，但 MCP 工具由 mcpClient.getTools() 提供。
while (true) {
  const response = await modelWithTools.invoke(messages);

  if (response.tool_calls && response.tool_calls.length > 0) {
    // AI 回复必须先入栈，后面的 ToolMessage 才能通过 tool_call_id 正确关联回这一轮。
    messages.push(response);

    for (const toolCall of response.tool_calls) {
      const { name, args } = toolCall;
      let result;
      console.log(`[调试] 工具调用: ${name}, 参数:`, JSON.stringify(args));

      try {
        if (name === "read_file") {
          result = await readFileTool.invoke(args);
        } else if (name === "write_file") {
          result = await writeFileTool.invoke(args);
        } else {
          result = `未知工具: ${name}`;
          console.log(`[错误] 未知工具: ${name}`);
        }
        console.log(`[调试] 工具执行结果: ${result?.substring?.(0, 100) || result}...`);
      } catch (err) {
        console.log(`[错误] 工具执行失败:`, err.message);
        result = `工具执行失败: ${err.message}`;
      }

      // 工具调用由应用侧执行：模型给的是意图，本地根据 name 找到工具并 invoke(args)。
      // tool_call_id 必须带，否则模型无法判断这条结果对应的是哪一次调用。
      messages.push(new ToolMessage({ content: result, tool_call_id: toolCall.id }));
    }

    continue;
  }

  // 这一轮 AI 没有 tool_calls，循环结束：模型拿到了工具结果并整理出了自然语言回复。
  console.log(`[AI 回复]: ${response.content}`);
  if (!response.content) {
    console.log("[调试] AI 没有返回任何内容，可能工具调用被拒绝了");
  }
  break;
}

