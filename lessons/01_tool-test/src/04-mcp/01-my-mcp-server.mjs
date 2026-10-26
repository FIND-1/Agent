/**
 * 示例 04-01：自己写一个 MCP Server（stdio 传输）
 *
 * 演示 MCP 三个核心要素：
 *   1. Tool：query_user（查用户）、update_user_role（改角色）、log_action（记日志）；
 *   2. Resource：docs://guide（只读文档，注入给模型用，不是工具）；
 *   3. Transport：StdioServerTransport，通过 stdin/stdout 与客户端进程通信。
 *
 * 依赖：无需模型 API；由 04-02 / 04-03 客户端以子进程方式拉起。
 * 单独运行本文件只会等待 stdin 指令（Ctrl+C 退出），属于正常现象。
 * 运行：node src/04-mcp/01-my-mcp-server.mjs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// 模拟数据库；实际开发这里换成 MySQL / MongoDB 等真实存储。
const database = {
  users: {
    '001': { id: '001', name: '张三', email: 'zhangsan@example.com', role: '111' },
    '002': { id: '002', name: '李四', email: 'lisi@example.com', role: 'user' },
    '003': { id: '003', name: '王五', email: 'wangwu@example.com', role: 'user' },
  }
};

// 3. 初始化服务器实例
const server = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

// 4. 注册工具 (Tool)：query_user
// description 是模型决定何时调用的依据；inputSchema 用 zod 约束参数。
server.registerTool('query_user', {
  description: '查询数据库中的用户信息。输入用户 ID，返回该用户的详细信息（姓名、邮箱、角色）。',
  inputSchema: {
    userId: z.string().describe('用户 ID，例如: 001, 002, 003'),
  },
}, async ({ userId }) => {
  const user = database.users[userId];

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

  return {
    content: [
      {
        type: 'text',
        text: `用户信息：\n- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`,
      },
    ],
  };
});

// 5. 注册资源 (Resource)：docs://guide
// Resource 是只读静态内容，模型按需读取，不是工具。
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

// 6. 注册工具：update_user_role（多参数示例）
// 这个工具有副作用：直接改写 database.users[i].role，体现「工具会改变外部状态」。
server.registerTool('update_user_role', {
  description: '修改指定用户的角色权限。',
  inputSchema: {
    userId: z.string().describe('需要修改的用户 ID'),
    newRole: z.enum(['admin', 'user', 'guest']).describe('新的角色名称：admin, user 或 guest'),
  },
}, async ({ userId, newRole }) => {
  const user = database.users[userId];
  if (!user) {
    return {
      content: [{ type: 'text', text: `修改失败：找不到用户 ID ${userId}` }],
    };
  }

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

  const oldRole = user.role;
  user.role = newRole;

  return {
    content: [
      {
        type: 'text',
        text: `修改成功！用户 ${user.name} (ID: ${userId}) 的角色已从 ${oldRole} 变更为 ${newRole}。`,
      },
    ],
  };
});


// 7. 注册工具：log_action（带时间戳的简单日志）
const actionLogs = [];

server.registerTool('log_action', {
  description: '记录系统中执行的关键操作日志。当修改用户信息或执行敏感操作后，应调用此工具存档。',
  inputSchema: {
    operator: z.string().describe('操作员姓名，通常指 AI 助手'),
    action: z.string().describe('操作描述，例如：修改了用户 002 的角色'),
    timestamp: z.string().describe('操作时间'),
  },
}, async ({ operator, action, timestamp }) => {
  const logEntry = { operator, action, timestamp };
  actionLogs.push(logEntry);

  // 写到 stderr 是为了让客户端把 stdout 留给协议通信。
  console.error(`[LOG SAVED]: ${JSON.stringify(logEntry)}`);

  return {
    content: [{ type: 'text', text: `日志记录成功：${action}` }],
  };
});

// 8. 启动连接：服务器挂到 stdio 上，等待客户端发来的请求。
const transport = new StdioServerTransport();
await server.connect(transport);