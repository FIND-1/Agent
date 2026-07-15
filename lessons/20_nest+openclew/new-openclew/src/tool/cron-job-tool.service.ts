import { Inject, Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { JobService } from '../job/job.service';
import { AppTool } from './tool.types';

type CronJobToolArgs = {
  action: 'list' | 'add' | 'toggle';
  id?: string;
  enabled?: boolean;
  type?: 'cron' | 'every' | 'at';
  instruction?: string;
  cron?: string;
  everyMs?: number;
  at?: string;
};

/**
 * 复习重点：
 * cron_job 是“创建和管理未来任务”的工具，只负责保存、列出、启停任务，不负责立刻执行任务内容。
 *
 * 原文分析结论：
 * 用户的自然语言必须拆成两部分：时间条件进入 type/cron/everyMs/at，真正要做的事进入 instruction。
 *
 * 依赖条件：
 * 依赖 JobService；at 必须是合法 ISO 时间字符串，everyMs 必须是正整数毫秒数。
 */
@Injectable()
export class CronJobToolService {
  readonly tool: AppTool;

  @Inject(JobService)
  private readonly jobService: JobService;

  constructor() {
    const cronJobArgsSchema = z.object({
      action: z
        .enum(['list', 'add', 'toggle'])
        .describe('Action to run: list, add, toggle'),
      id: z.string().optional().describe('Job ID for toggle'),
      enabled: z
        .boolean()
        .optional()
        .describe('Whether the job should be enabled'),
      type: z
        .enum(['cron', 'every', 'at'])
        .optional()
        .describe('Job type for add'),
      instruction: z
        .string()
        .optional()
        .describe('Natural-language instruction for add'),
      cron: z.string().optional().describe('Cron expression for type=cron'),
      everyMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Interval in milliseconds for type=every'),
      at: z.string().optional().describe('ISO timestamp for type=at'),
    });

    this.tool = tool(
      async ({
        action,
        id,
        enabled,
        type,
        instruction,
        cron,
        everyMs,
        at,
      }: CronJobToolArgs) => {
        switch (action) {
          case 'list': {
            const jobs = await this.jobService.listJobs();
            if (!jobs.length) return 'There are no scheduled jobs.';

            const lines = jobs
              .map((job) => {
                const atText =
                  job.at instanceof Date
                    ? job.at.toISOString()
                    : (job.at ?? '');
                return `id=${job.id} type=${job.type} enabled=${job.isEnabled} running=${job.running} cron=${job.cron ?? ''} everyMs=${job.everyMs ?? ''} at=${atText} instruction=${job.instruction}`;
              })
              .join('\n');

            return `Scheduled jobs:\n${lines}`;
          }

          case 'add': {
            if (!type) return 'Adding a job requires type.';
            if (!instruction) return 'Adding a job requires instruction.';

            if (type === 'cron') {
              if (!cron) return 'type=cron requires cron.';
              const created = await this.jobService.addJob({
                type,
                instruction,
                cron,
                isEnabled: true,
              });
              return `Created job: id=${created.id} type=cron cron=${created.cron ?? ''} enabled=${created.isEnabled}`;
            }

            if (type === 'every') {
              if (typeof everyMs !== 'number' || everyMs <= 0) {
                return 'type=every requires a positive everyMs.';
              }
              const created = await this.jobService.addJob({
                type,
                instruction,
                everyMs,
                isEnabled: true,
              });
              return `Created job: id=${created.id} type=every everyMs=${created.everyMs ?? ''} enabled=${created.isEnabled}`;
            }

            if (!at) return 'type=at requires at.';
            const date = new Date(at);
            if (Number.isNaN(date.getTime())) {
              return 'type=at requires a valid ISO timestamp.';
            }

            const created = await this.jobService.addJob({
              type: 'at',
              instruction,
              at: date,
              isEnabled: true,
            });
            return `Created job: id=${created.id} type=at at=${created.at?.toISOString() ?? ''} enabled=${created.isEnabled}`;
          }

          case 'toggle': {
            if (!id) return 'Toggling a job requires id.';
            const updated = await this.jobService.toggleJob(id, enabled);
            return `Updated job: id=${updated.id} enabled=${updated.isEnabled}`;
          }
        }
      },
      {
        name: 'cron_job',
        description: 'Manage scheduled jobs. Supports list, add, and toggle.',
        schema: cronJobArgsSchema,
      },
    );
  }
}
