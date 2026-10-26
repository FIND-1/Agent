/**
 * 示例 04-02：LangChain 作为 MCP Client（单服务器 + Resource）
 *
 * 对比示例 01：tools 不再来自本地 tool()，而是用 MultiServerMCPClient.getTools()
 * 从 MCP Server 拉取，再 bindTools 交给模型；ReAct 循环写法与示例 01 一致。
 *
 * 本例额外演示 Resource：listResources() / readResource() 读出参考文档，
 * 作为 SystemMessage 注入到对话里，相当于给模型一份「外挂参考书」。
 *
 * 依赖：OPENAI_API_KEY / OPENAI_BASE_URL / MODEL_NAME。
 * 客户端会自动用子进程拉起 my-mcp-server，不需要单独起服务。
 * 运行：node src/04-mcp/02-langchain-mcp-test.mjs
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import chalk from "chalk";
import { HumanMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const model = createChatModel();

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "node",
      args: [join(__dirname, "01-my-mcp-server.mjs")],
    },
  },
});

// MCP 工具来源：getTools() 把协议层的工具定义转成 LangChain 的 StructuredTool。
// 对模型来说和示例 01 的本地 tool() 没区别，仍走 tool_calls -> ToolMessage 循环。
const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 10) {
  // 把 Resource 内容直接塞进 SystemMessage，让模型在第一轮就把这些背景当作规则。
  const res = await mcpClient.listResources();
  let resourceContent = "以下是 MCP 服务器提供的参考文档：\n";

  for (const [serverName, resources] of Object.entries(res)) {
    for (const resource of resources) {
      const content = await mcpClient.readResource(serverName, resource.uri);
      resourceContent += content[0].text + "\n";
    }
  }

  const messages = [
    new SystemMessage(resourceContent),
    new HumanMessage(query),
  ];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));

    const response = await modelWithTools.invoke(messages);

    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    console.log(chalk.bgBlue(`🔍 检测到工具调用: ${response.tool_calls.map((t) => t.name).join(", ")}`));

    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id,
          }),
        );
      }
    }
  }
}

// 演示场景：问使用指南，模型会读取 01 号 Resource 后回答。
await runAgentWithTools("MCP Server 的使用指南是什么");

await mcpClient.close();

