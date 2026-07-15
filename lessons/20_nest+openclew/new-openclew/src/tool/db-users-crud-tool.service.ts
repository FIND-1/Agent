import { Inject, Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AppTool } from './tool.types';

type UserToolArgs = {
  action: 'create' | 'list' | 'get' | 'update' | 'delete';
  id?: number;
  name?: string;
  email?: string;
};

function formatUser(user: User): string {
  return `ID=${user.id}, name=${user.name}, email=${user.email}, createdAt=${user.createdAt?.toISOString?.() ?? ''}`;
}

/**
 * 复习重点：
 * db_users_crud 是用户表 CRUD 的 Agent 工具层，用 action 分发到 UsersService。
 *
 * 原文分析结论：
 * 工具 schema 要把模型需要补齐的字段讲清楚：create 需要 name/email，get/update/delete 需要 id。
 *
 * 依赖条件：
 * 依赖 UsersService 和 MySQL；当前项目没有数据库环境，所以该 tool 暂按 TODO/教学结构处理。
 */
@Injectable()
export class DbUsersCrudToolService {
  readonly tool: AppTool;

  @Inject(UsersService)
  private readonly usersService: UsersService;

  constructor() {
    const dbUsersCrudArgsSchema = z.object({
      action: z
        .enum(['create', 'list', 'get', 'update', 'delete'])
        .describe('Action to run: create, list, get, update, delete'),
      id: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('User ID for get/update/delete'),
      name: z
        .string()
        .min(1)
        .max(50)
        .optional()
        .describe('User name for create/update'),
      email: z
        .string()
        .email()
        .max(50)
        .optional()
        .describe('User email for create/update'),
    });

    this.tool = tool(
      async ({ action, id, name, email }: UserToolArgs) => {
        switch (action) {
          case 'create': {
            if (!name || !email) {
              return 'Creating a user requires both name and email.';
            }

            const created = await this.usersService.create({ name, email });
            return `Created user: ${formatUser(created)}`;
          }

          case 'list': {
            const users = await this.usersService.findAll();
            if (!users.length) {
              return 'There are no users in the database.';
            }

            return `Users:\n${users.map(formatUser).join('\n')}`;
          }

          case 'get': {
            if (!id) {
              return 'Getting a user requires id.';
            }

            const user = await this.usersService.findOne(id);
            return user
              ? `User: ${formatUser(user)}`
              : `User ${id} does not exist.`;
          }

          case 'update': {
            if (!id) {
              return 'Updating a user requires id.';
            }

            const payload: UpdateUserDto = {};
            if (name !== undefined) payload.name = name;
            if (email !== undefined) payload.email = email;
            if (!Object.keys(payload).length) {
              return 'No update fields were provided.';
            }

            const existing = await this.usersService.findOne(id);
            if (!existing) {
              return `User ${id} does not exist.`;
            }

            await this.usersService.update(id, payload);
            const updated = await this.usersService.findOne(id);
            return updated
              ? `Updated user: ${formatUser(updated)}`
              : `User ${id} does not exist.`;
          }

          case 'delete': {
            if (!id) {
              return 'Deleting a user requires id.';
            }

            const existing = await this.usersService.findOne(id);
            if (!existing) {
              return `User ${id} does not exist, no delete needed.`;
            }

            await this.usersService.remove(id);
            return `Deleted user: ${formatUser(existing)}`;
          }
        }
      },
      {
        name: 'db_users_crud',
        description:
          'Create, list, get, update, or delete records in the users table.',
        schema: dbUsersCrudArgsSchema,
      },
    );
  }
}
