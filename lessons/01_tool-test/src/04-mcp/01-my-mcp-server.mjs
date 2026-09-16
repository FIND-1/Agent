// 1. 导入必要的模块
// McpServer: 用来创建服务器的核心类
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// StdioServerTransport: 定义通信方式，这里是用标准输入输出（水管）来传话
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// z (Zod): 用来做数据检查的，防止 AI 传错参数类型
import { z } from 'zod';

// 2. 模拟数据库
// 实际开发中这里可能是连接 MySQL 或 MongoDB 的代码
const database = {
  users: {
    '001': { id: '001', name: '张三', email: 'zhangsan@example.com', role: '111' },
    '002': { id: '002', name: '李四', email: 'lisi@example.com', role: 'user' },
    '003': { id: '003', name: '王五', email: 'wangwu@example.com', role: 'user' },
  }
};

// 3. 初始化服务器实例
// 起个名字和版本号，方便识别
const server = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

// 4. 注册工具 (Tool)：这是 AI 能干活的“技能”
server.registerTool('query_user', {
  // description: 告诉 AI 这个工具是干嘛的（AI 会根据这个决定什么时候用它）
  description: '查询数据库中的用户信息。输入用户 ID，返回该用户的详细信息（姓名、邮箱、角色）。',
  // inputSchema: 规定 AI 传参数必须遵守的格式（Zod 负责检查）
  inputSchema: {
    userId: z.string().describe('用户 ID，例如: 001, 002, 003'),
  },
}, async ({ userId }) => {
  // --- 下面是具体的执行逻辑 ---
  
  // 根据 ID 去数据库找人
  const user = database.users[userId];

  // 如果没找到人
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: `用户 ID ${userId} 不存在。可用的 ID: 001, 002, 003`,
        },
      ],
    };
  }

  // 如果找到了人，返回格式化好的信息
  return {
    content: [
      {
        type: 'text',
        text: `用户信息：\n- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`,
      },
    ],
  };
});

// 5. 注册资源 (Resource)：这是给 AI 看的“参考书”
// 和 Tool 不同，Resource 是静态内容，AI 可以随时读取来辅助它理解
server.registerResource('使用指南', 'docs://guide', {
  description: 'MCP Server 使用文档',
  mimeType: 'text/plain',
}, async () => {
  return {
    contents: [
      {
        uri: 'docs://guide',
        mimeType: 'text/plain',
        text: `MCP Server 使用指南

功能：提供用户查询等工具。

使用：在 Cursor 等 MCP Client 中通过自然语言对话，Cursor 会自动调用相应工具。`,
      },
    ],
  };
});

//--附加练习 注册修改用户角色的工具---
server.registerTool('update_user_role', {
  description: '修改指定用户的角色权限。',
  inputSchema: {
    // 知识点：复合参数。AI 需要同时提供 ID 和新角色。
    userId: z.string().describe('需要修改的用户 ID'),
    newRole: z.enum(['admin', 'user', 'guest']).describe('新的角色名称：admin, user 或 guest'),
  },
}, async ({ userId, newRole }) => {
  // 1. 检查用户是否存在
  const user = database.users[userId];
  if (!user) {
    return {
      content: [{ type: 'text', text: `修改失败：找不到用户 ID ${userId}` }],
    };
  }

  // 2. 角色一致时直接返回，避免无意义更新
  if (user.role === newRole) {
    return {
      content: [
        {
          type: 'text',
          text: `无需修改：用户 ${user.name} (ID: ${userId}) 当前角色已经是 ${newRole}。`,
        },
      ],
    };
  }

  // 3. 执行修改逻辑 (知识点：副作用 - 工具改变了外部系统的状态)
  const oldRole = user.role;
  user.role = newRole;

  // 4. 返回执行结果告知 AI
  return {
    content: [
      {
        type: 'text',
        text: `修改成功！用户 ${user.name} (ID: ${userId}) 的角色已从 ${oldRole} 变更为 ${newRole}。`,
      },
    ],
  };
});


//--- 附加练习 模拟日志数据库 ----
const actionLogs = [];

// 注册日志记录工具
server.registerTool('log_action', {
  description: '记录系统中执行的关键操作日志。当修改用户信息或执行敏感操作后，应调用此工具存档。',
  inputSchema: {
    operator: z.string().describe('操作员姓名，通常指 AI 助手'),
    action: z.string().describe('操作描述，例如：修改了用户 002 的角色'),
    timestamp: z.string().describe('操作时间'),
  },
}, async ({ operator, action, timestamp }) => {
  // 1. 将日志存入数组（模拟存入数据库）
  const logEntry = { operator, action, timestamp };
  actionLogs.push(logEntry);

  // 2. 在控制台打印出来，方便我们观察
  console.error(`[LOG SAVED]: ${JSON.stringify(logEntry)}`); 

  return {
    content: [{ type: 'text', text: `日志记录成功：${action}` }],
  };
});

// 6. 启动连接
// 创建传输管道（Stdio 就是标准输入输出）
const transport = new StdioServerTransport();
// 把服务器连到管道上，开始监听 AI 的指令
// await 表示这里会一直等着，直到有消息来
await server.connect(transport);