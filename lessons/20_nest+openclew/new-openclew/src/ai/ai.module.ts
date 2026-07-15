import { Module } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { JobAgentService } from './job-agent.service';
import { UsersModule } from '../users/users.module';
import { JobModule } from '../job/job.module';
import { ToolModule } from '../tool/tool.module';

const sampleUsers = {
  '001': {
    id: '001',
    name: 'Zhang San',
    email: 'zhangsan@example.com',
    role: 'admin',
  },
  '002': {
    id: '002',
    name: 'Li Si',
    email: 'lisi@example.com',
    role: 'user',
  },
  '003': {
    id: '003',
    name: 'Wang Wu',
    email: 'wangwu@example.com',
    role: 'user',
  },
} as const;

const queryUserArgsSchema = z.object({
  userId: z.string().describe('User ID, for example: 001, 002, 003'),
});

/**
 * 复习重点：
 * AiModule 组装面向用户请求的 Agent：Controller、AiService、后台 JobAgentService 和可用工具。
 *
 * 原文分析结论：
 * QUERY_USER_TOOL 是早期内存示例工具；真实可扩展能力主要来自 ToolModule 导出的工具集合。
 *
 * 依赖条件：
 * AiService 需要 CHAT_MODEL 以及全部 tool token；JobAgentService 复用 ToolModule 但不会使用 cron_job。
 */
@Module({
  imports: [UsersModule, JobModule, ToolModule],
  controllers: [AiController],
  providers: [
    AiService,
    JobAgentService,
    {
      provide: 'QUERY_USER_TOOL',
      useFactory: () =>
        tool(
          ({ userId }: { userId: string }) => {
            const user = sampleUsers[userId as keyof typeof sampleUsers];

            if (!user) {
              return `User ID ${userId} does not exist. Available IDs: ${Object.keys(sampleUsers).join(', ')}`;
            }

            return `User info:
- ID: ${user.id}
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}`;
          },
          {
            name: 'query_user',
            description: 'Query sample user information by user ID.',
            schema: queryUserArgsSchema,
          },
        ),
    },
  ],
})
export class AiModule {}
