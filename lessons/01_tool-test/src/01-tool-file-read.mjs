/**
 * 示例 01：第一个 tool —— 让大模型自己读文件（对应文章「接下来开发 tool」）
 *
 * 原文主线（本文件按这个顺序读完就能对上文章）：
 * 1. 用 tool() 定义工具：函数体 + name + description + zod schema；
 * 2. model.bindTools(tools) 把工具声明交给模型；
 * 3. 用 SystemMessage 约定工作流程，用 HumanMessage 提出「读取文件并解释代码」的需求；
 * 4. 先 invoke 一次，观察 AIMessage 里的 tool_calls：模型只解析出参数，不会自己执行；
 * 5. 应用侧按 tool_calls 找到同名工具并 invoke，把结果包成 ToolMessage 回填 messages，
 *    必须带 tool_call_id，告诉模型「你要的那次调用，结果是这个」；
 * 6. 再次 invoke，让模型基于工具结果给出最终解释。
 *
 * 和原文的差异（复习时注意）：
 * - 原文只定义了 read_file；本文件额外定义了 write_file，用来演示「读到的内容再写出去」，
 *   所以第二个人类消息要求把结果写入 src/tool-file-write.mjs。
 * - 原文的循环是 while + Promise.all 并发执行；本文件用 while (true) + for 顺序执行，
 *   便于逐条观察每次工具调用的入参和返回值（复习重点是循环本身，不是并发写法）。
 * - 原文把 ChatOpenAI 初始化写在文件里；本文件改用 @lessons/shared/model，temperature 仍为 0。
 *
 * 依赖：需要模型 API（.env）。
 * 副作用：会真实读取文件，并把模型输出写入 src/tool-file-write.mjs（运行产物，不参与编号）。
 * 原文路径映射：src/tool-file-read.mjs -> src/01-tool-file-read.mjs
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { tool } from "@langchain/core/tools";
import {
  HumanMessage, // 人类消息
  SystemMessage, // 系统消息
  ToolMessage, // 工具消息
  AIMessage, // AI 消息
} from "@langchain/core/messages"; //具体的消息有四种：SystemMessage、HumanMessage、AIMessage、ToolMessage
// SystemMessage：设置 AI 是谁，可以干什么，有什么能力，以及一些回答、行为的规范等
// HumanMessage：用户输入的信息
// AIMessage：AI 的回复信息
// ToolMessage：调用工具的结果返回
import fs from "node:fs/promises"; // 导入 fs 模块
import { z } from "zod"; // 这里需要用到 langchain 的核心包，所以需要安装


const model = createChatModel({
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
});

// 创建一个读取文件的工具
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

const tools = [readFileTool, writeFileTool]; // 创建一个工具数组

const modelWithTools = model.bindTools(tools); // 绑定工具到模型

const messages = [ // 创建一个消息数组
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


// 定义一个递归或循环函数来处理对话
while (true) {
  const response = await modelWithTools.invoke(messages);

  // 如果 AI 想调用工具
  if (response.tool_calls && response.tool_calls.length > 0) {
    // 1. 先把 AI 的回复加入消息列表（必须有这条消息，ToolMessage 才能正确关联）
    messages.push(response);

    // 2. 遍历所有工具调用并执行
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

      // 3. 把工具结果塞回消息列表，也就是对话记录
      messages.push(new ToolMessage({ content: result, tool_call_id: toolCall.id }));
    }

    // 4. 继续循环，让 AI 处理工具结果
    continue;
  }

  // 如果 AI 没有调用工具，直接说话，则结束
  console.log(`[AI 回复]: ${response.content}`);
  if (!response.content) {
    console.log("[调试] AI 没有返回任何内容，可能工具调用被拒绝了");
  }
  break;
}



