import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
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


const model = new ChatOpenAI({ // 创建一个 OpenAI 模型
  modelName: process.env.MODEL_NAME || "qwen-coder-turbo",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0, // 0: ai 的创造性，设置为 0，让它严格按照指令来做事情
  configuration: {
    baseURL: process.env.BASE_URL,
  },
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
  new HumanMessage("请读取 src/tool-file-read.mjs 文件内容并解释代码, 然后将打印的结果写入到 src/tool-file-write.mjs 文件中"),
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
