// 1. 导入库
import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { MultiServerMCPClient } from "@langchain/mcp-adapters"; // MCP 适配器，让 LangChain 能连接 MCP 服务器
import chalk from "chalk";
import { HumanMessage, ToolMessage, SystemMessage } from "@langchain/core/messages"; // 定义对话消息类型的类
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* * 
 * * 【实验目的】：测试 LangChain 的 MCP 适配器，验证 MCP 服务器的集成与工具/资源调用流程。
 * * 【涉及核心知识点】：
 * 1. ReAct 模式 (Reason + Act):
 *   - Reason (思考)：AI 分析用户意图（如“查用户 002”），识别出需要调用特定的 MCP 工具（如 query_user）。
 *   - Act (行动)：AI 生成 `tool_calls` 指令，由客户端（本项目）执行本地/远程代码。
 *   - Observation (观察)：程序将执行结果（如“李四，管理员”）反馈给 AI。
 *   - Final Answer (总结)：AI 整合所有观察到的信息，输出最终的自然语言回答。
 * * 2. MCP (Model Context Protocol) 核心要素：
 *   - Tools (工具)：跨语言的可执行函数。本例中通过 stdio 进程通信调用 Node.js 编写的工具。
 *   - Resources (资源)：只读的数据源。类似 AI 的“外挂文档”，代码中将其读取并注入 SystemMessage 作为上下文。
 *   - Transports (传输层)：本项目使用 Stdio（标准输入输出），也支持 HTTP/SSE 等远程通信方式。
 * * 3. LangChain MCP Adapter:
 *   - 适配器角色：将 MCP 协议定义的工具转换为 LangChain 兼容的 `StructuredTool` 对象。
 *   - 动态绑定：使用 `model.bindTools()` 实时将 MCP 服务器的能力“赋予”大模型。
 * * 【数据流向图解】：
 * [用户提问] -> [LangChain + Model] -> [发现 MCP 工具/资源请求] 
 * |
 * [MCP Client 调度]
 * |
 * ---------------------------------
 * |              |                |
 * [读取本地资源]   [调用外部工具]    [访问远程数据]
 * |              |                |
 * ---------------------------------
 * |
 * [最终回复] <- [AI 综合处理结果] <---------- [返回 Observation]

 * 【实验步骤】：
 * 1. 启动 MCP 服务器：node my-mcp-server.mjs
 * 2. 启动 LangChain MCP Adapter：node langchain-mcp-test.mjs
 * 3. 输入指令：node langchain-mcp-test.mjs "查询 002 的信息并把角色改为 admin"
 * 4. 观察输出：AI 的回复
 * 5. 观察 MCP 服务器日志：node my-mcp-server.mjs
 * 6. 观察 LangChain MCP Adapter 日志：node langchain-mcp-test.mjs
 * 7. 观察 MCP 服务器日志：node my-mcp-server.mjs
 */

// 2. 初始化大模型
const model = createChatModel();

// 3. 定义并连接 MCP 服务器 ("my-mcp-server.mjs" 是 MCP 服务器文件)

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "node",
      // 动态拼接出绝对路径
      args: [join(__dirname, "my-mcp-server.mjs")],
    },
  },
});

// 4. 工具绑定：关键步骤！
// 从 MCP 服务器中“拉取”所有可用的工具定义（比如 query_user）
const tools = await mcpClient.getTools();
// 告诉 AI：你有这些工具可以用，请在需要时调用它们
const modelWithTools = model.bindTools(tools);

// 5. 核心：Agent 运行循环 (ReAct 模式)
async function runAgentWithTools(query, maxIterations = 10) {
  // --- 1. 先准备好资源内容 (Resources) ---
  const res = await mcpClient.listResources();
  let resourceContent = "以下是 MCP 服务器提供的参考文档：\n"; // 给 AI 一个提示前缀
  
  for (const [serverName, resources] of Object.entries(res)) {
    for (const resource of resources) {
      const content = await mcpClient.readResource(serverName, resource.uri);
      resourceContent += content[0].text + "\n";
    }
  }

  // --- 2. 初始化对话历史 (把资源塞进 SystemMessage) ---
  // 关键：这里创建的 messages 数组包含了背景知识
  const messages = [
    new SystemMessage(resourceContent), 
    new HumanMessage(query),
  ];

  // --- 3. 进入 ReAct 循环 ---
  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));

    // 关键点：传入的是上面的 messages 数组，而不是单条 query
    const response = await modelWithTools.invoke(messages); 
    
    // 把 AI 的回复存入历史，以便下次迭代（如果有工具调用）
    messages.push(response); 

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    // --- 4. 工具调用逻辑 ---
    console.log(chalk.bgBlue(`🔍 检测到工具调用: ${response.tool_calls.map((t) => t.name).join(", ")}`));

    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args);

        // 将工具结果喂回 messages 数组
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id,
          }),
        );
      }
    }
    // 循环继续，下一次 invoke 会带着更新后的 messages 重新请求 AI
  }
}

// await runAgentWithTools("查一下用户 002 的信息");

// 终端运行 Agent 并输出指令： node langchain-mcp-test.mjs "查询 002 的信息并把角色改为 admin"
// const userInput = process.argv.slice(2).join(' ') || "查一下用户 001 的信息";

// console.log(chalk.cyan(`🚀 收到指令: ${userInput}`));

//  终端直接运行 Agent
// await runAgentWithTools(userInput);

// 6. 使用
await runAgentWithTools("MCP Server 的使用指南是什么");


// 7. 关闭 MCP 客户端
await mcpClient.close();



