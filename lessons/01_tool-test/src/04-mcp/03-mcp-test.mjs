/**
 * 示例 04-03：多源 MCP —— 本地 stdio + 远程 HTTP + 官方 filesystem
 *
 * 演示「工具来源可以混合」，三类服务器同时挂载：
 *   1. my-mcp-server：本地 stdio 业务查询能力；
 *   2. amap-maps-streamableHTTP：远程 HTTP（高德地图）；
 *   3. filesystem：官方文件系统服务器，npx 拉起，操作范围由 ALLOWED_PATHS 限定。
 *
 * 对模型来说这些仍是普通工具，模型不需要知道工具来自本地还是远程。
 * 复习重点：mcpServers 的配置形态，以及工具结果为什么必须序列化成字符串再回填
 * （MCP 返回的可能是对象或复杂结构，而 ToolMessage.content 必须是字符串）。
 *
 * 依赖：OPENAI_API_KEY / OPENAI_BASE_URL / MODEL_NAME；高德需要 AMAP_MAPS_API_KEY；
 * filesystem 需要 npx 联网拉包，ALLOWED_PATHS 必须是目录白名单。
 * 运行产物：同目录 route.md 是此前跑出来的路线结果，不是示例脚本，不参与编号。
 * 运行：node src/04-mcp/03-mcp-test.mjs
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import chalk from "chalk";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const model = createChatModel();

// mcpServers 的 key 就是给模型的「工具来源名」。
// A. 本地 stdio（业务）；B. 远程 HTTP（高德）；C. 官方 filesystem（npx 拉起）。
const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "node",
      args: [join(__dirname, "01-my-mcp-server.mjs")],
    },
    "amap-maps-streamableHTTP": {
      url: "https://mcp.amap.com/mcp?key=" + process.env.AMAP_MAPS_API_KEY,
    },
    filesystem: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        ...(process.env.ALLOWED_PATHS?.split(",") || []),
      ],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [
    new SystemMessage(
      "你是一个高效的执行型智能助手。你的核心规则是：\n" +
      "1. 当用户提出需求时，你必须【直接调用工具】来获取数据或执行操作，禁止描述你的计划。\n" +
      "2. 如果需要地理坐标，必须先调用 maps_geo 获取经纬度，严禁编造坐标。\n" +
      "3. 尽最大努力自主完成任务，除非绝对必要，否则不要反问用户。\n" +
      "4. 所有的回复必须基于工具返回的真实结果。"
    ),
    new HumanMessage(query)
  ];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考 (第 ${i + 1} 轮)...`));

    const response = await modelWithTools.invoke(messages);

    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个并行工具调用`));
    console.log(chalk.bgBlue(`🔍 工具列表: ${response.tool_calls.map((t) => t.name).join(", ")}`));

    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args);

        // MCP 工具返回的结果可能是字符串、JSON 对象甚至更复杂的结构；
        // 模型 ToolMessage.content 必须是字符串，所以这里统一序列化成字符串再回填。
        let contentStr = "";
        if (typeof toolResult === "string") {
          contentStr = toolResult;
        } else {
          try {
            contentStr = JSON.stringify(toolResult);
          } catch (e) {
            contentStr = String(toolResult);
          }
        }

        messages.push(
          new ToolMessage({
            content: contentStr,
            tool_call_id: toolCall.id,
          }),
        );
      }
    }
  }
}

await runAgentWithTools(
  "杭州西湖附近的好评最高的5个饭店，拿到饭店图片，打开浏览器，展示每个饭店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为饭店名"
);

await mcpClient.close();

