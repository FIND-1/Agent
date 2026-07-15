import { Module } from '@nestjs/common';
import { JobService } from './job.service';

/**
 * 复习重点：
 * JobModule 只导出 JobService，让定时任务的持久化和运行时管理集中在一个模块。
 *
 * 原文分析结论：
 * cron_job tool 通过 JobService 管理任务，避免 tool 层直接操作 SchedulerRegistry。
 *
 * 依赖条件：
 * 如果后续把 JobAgentService 接入 JobService，可能需要处理 JobModule 与 AiModule 的循环引用。
 */
@Module({
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
