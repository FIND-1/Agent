// 1. 导入依赖与环境配置
import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { MultiServerMCPClient } from "@langchain/mcp-adapters"; 
import chalk from "chalk";
// SystemMessage 系统消息，用于设置 AI 的规则和行为 , 对于工具调用有很强的约束力--是 Agent 的“大脑说明书”。
// HumanMessage 人类消息，用于输入用户的问题或需求--是 Agent 的“嘴巴”。
// ToolMessage 工具消息，用于调用工具的结果返回--是 Agent 的“手”。
// 以上三者缺一不可，剩下的 AIMessage 是 AI 的回复消息--是 Agent 的“大脑”。
import { HumanMessage, SystemMessage , ToolMessage } from "@langchain/core/messages";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 【核心知识点：多源 MCP 架构】
 * 1. 混合传输层 (Hybrid Transport): 
 * - 同时支持 Stdio (本地进程) 和 HTTP/SSE (远程服务)。
 * 2. 多服务器并发 (Multi-Server):
 * - 客户端聚合了来自不同服务器的 Tools，AI 无需关心工具来源，只需按需调用。
 * 3. 动态环境隔离:
 * - 通过 process.env.ALLOWED_PATHS 严格限制 Agent 对本地文件系统的操作范围。
 */

// 2. 初始化大模型 (使用兼容 OpenAI 接口的通义千问)
const model = createChatModel();

// 3. 配置多 MCP 服务器列表
const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    // A. 本地自定义服务器：处理业务逻辑（如查询用户信息）
    "my-mcp-server": {
      command: "node",
      args: [join(__dirname, "my-mcp-server.mjs")],
    },
    // B. 远程 HTTP 服务器：接入高德地图能力 (流式 HTTP 传输)
    "amap-maps-streamableHTTP": {
      url: "https://mcp.amap.com/mcp?key=" + process.env.AMAP_MAPS_API_KEY,
    },
    // C. 标准文件系统服务器：提供读写本地文件的能力
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

/**
 * 【实验关键步骤】：
 * 1. 工具发现：getTools() 会扫描所有配置的服务器，获取所有工具的 Schema（名称、参数定义）。
 * 2. 工具绑定：bindTools() 将这些定义转化为大模型可理解的 function calling 格式。
 */
const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

/**
 * 【函数：runAgentWithTools】
 * 采用 ReAct (Reason + Act) 模式，支持多轮工具调用。
 */
async function runAgentWithTools(query, maxIterations = 30) {
// --- 关键修改点：在数组第一项注入 SystemMessage ---
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
  // const messages = [new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考 (第 ${i + 1} 轮)...`));
    
    // AI 决策：根据当前上下文决定是“回答”还是“调工具” ，这是 Agent 的“大脑”在决策。
    // LangChain 会接收大模型返回的原始数据，并将其包装成一个 AIMessage 对象。。
    const response = await modelWithTools.invoke(messages);

    // console.log(chalk.gray(`[DEBUG] AIMessage 内容: ${JSON.stringify(response, null, 2)}`));
    messages.push(response);

    // 终止条件：AI 不再需要调用工具，给出最终回答
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个并行工具调用`));
    console.log(chalk.bgBlue(`🔍 工具列表: ${response.tool_calls.map((t) => t.name).join(", ")}`));

    /**
     * 【知识点：结果序列化处理】
     * MCP 工具返回的结果可能是字符串、JSON 对象或复杂结构。
     * 大模型（如 Qwen 或 GPT）的 ToolMessage.content 必须是字符串。
     */
    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        // 执行工具获取结果
        const toolResult = await foundTool.invoke(toolCall.args);

        // 鲁棒性转换逻辑：
        let contentStr = "";
        if (typeof toolResult === "string") {
          contentStr = toolResult;
        } else {
          try {
            // 尝试将对象转为 JSON 字符串，方便 AI 解析内部结构
            contentStr = JSON.stringify(toolResult);
          } catch (e) {
            contentStr = String(toolResult);
          }
        }

        // 将观察结果 (Observation) 反馈给模型
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

/**
 * 【场景测试】：
 * 此时 Agent 具备了：
 * 1. 地图查询能力（高德）
 * 2. 文件读写能力（filesystem）
 * 3. 浏览器操作/图片展示能力（my-mcp-server 如果实现了相关工具）
 */
await runAgentWithTools(
  "杭州西湖附近的好评最高的5个饭店，拿到饭店图片，打开浏览器，展示每个饭店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为饭店名"
);

// 任务完成后优雅关闭连接
await mcpClient.close();



