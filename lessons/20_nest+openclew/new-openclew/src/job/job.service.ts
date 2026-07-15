import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { EntityManager } from 'typeorm';
import { Job } from './entities/job.entity';

export type JobWithRunning = Job & { running: boolean };

/**
 * 复习重点：
 * JobService 同时管理数据库里的 Job 记录和当前进程里的定时任务运行时对象。
 *
 * 原文分析结论：
 * 定时任务必须持久化；服务重启后通过 onApplicationBootstrap 读取启用任务并重新注册到 SchedulerRegistry。
 *
 * 依赖条件：
 * 当前项目没有数据库环境；任务持久化与恢复只能作为 TODO。recordJobRun 也还没有接入 JobAgentService.runJob。
 */
@Injectable()
export class JobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobService.name);

  @Inject(EntityManager)
  private readonly entityManager: EntityManager;

  @Inject(SchedulerRegistry)
  private readonly schedulerRegistry: SchedulerRegistry;

  async onApplicationBootstrap(): Promise<void> {
    const enabledJobs = await this.entityManager.find(Job, {
      where: { isEnabled: true },
    });
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const intervals = this.schedulerRegistry.getIntervals();
    const timeouts = this.schedulerRegistry.getTimeouts();

    for (const job of enabledJobs) {
      const alreadyRegistered =
        (job.type === 'cron' && cronJobs.has(job.id)) ||
        (job.type === 'every' && intervals.includes(job.id)) ||
        (job.type === 'at' && timeouts.includes(job.id));

      if (!alreadyRegistered) {
        this.startRuntime(job);
      }
    }
  }

  async listJobs(): Promise<JobWithRunning[]> {
    const jobs = await this.entityManager.find(Job, {
      order: { createdAt: 'DESC' },
    });

    const cronJobs = this.schedulerRegistry.getCronJobs();
    const intervalNames = this.schedulerRegistry.getIntervals();
    const timeoutNames = this.schedulerRegistry.getTimeouts();

    return jobs.map((job) => {
      const running =
        job.isEnabled &&
        ((job.type === 'cron' && cronJobs.has(job.id)) ||
          (job.type === 'every' && intervalNames.includes(job.id)) ||
          (job.type === 'at' && timeoutNames.includes(job.id)));

      return {
        ...job,
        running,
      };
    });
  }

  async addJob(
    input:
      | {
          type: 'cron';
          instruction: string;
          cron: string;
          isEnabled?: boolean;
        }
      | {
          type: 'every';
          instruction: string;
          everyMs: number;
          isEnabled?: boolean;
        }
      | {
          type: 'at';
          instruction: string;
          at: Date;
          isEnabled?: boolean;
        },
  ): Promise<Job> {
    const entity = this.entityManager.create(Job, {
      instruction: input.instruction,
      type: input.type,
      cron: input.type === 'cron' ? input.cron : null,
      everyMs: input.type === 'every' ? input.everyMs : null,
      at: input.type === 'at' ? input.at : null,
      isEnabled: input.isEnabled ?? true,
      lastRun: null,
    });

    const saved = await this.entityManager.save(Job, entity);

    if (saved.isEnabled) {
      this.startRuntime(saved);
    }

    return saved;
  }

  async toggleJob(jobId: string, enabled?: boolean): Promise<Job> {
    const job = await this.entityManager.findOne(Job, { where: { id: jobId } });

    if (!job) {
      throw new NotFoundException(`Job not found: ${jobId}`);
    }

    const nextEnabled = enabled ?? !job.isEnabled;
    if (job.isEnabled !== nextEnabled) {
      job.isEnabled = nextEnabled;
      await this.entityManager.save(Job, job);
    }

    if (job.isEnabled) {
      this.startRuntime(job);
    } else {
      this.stopRuntime(job);
    }

    return job;
  }

  private startRuntime(job: Job): void {
    if (job.type === 'cron') {
      const cronJobs = this.schedulerRegistry.getCronJobs();
      const existing = cronJobs.get(job.id);
      if (existing) {
        existing.start();
        return;
      }

      const runtimeJob = this.createCronJob(job);
      this.schedulerRegistry.addCronJob(job.id, runtimeJob);
      runtimeJob.start();
      return;
    }

    if (job.type === 'every') {
      const names = this.schedulerRegistry.getIntervals();
      if (names.includes(job.id)) return;

      if (typeof job.everyMs !== 'number' || job.everyMs <= 0) {
        throw new Error(`Invalid everyMs for job ${job.id}`);
      }

      const ref = setInterval(() => {
        void this.recordJobRun(job);
      }, job.everyMs);

      this.schedulerRegistry.addInterval(job.id, ref);
      return;
    }

    if (job.type === 'at') {
      const names = this.schedulerRegistry.getTimeouts();
      if (names.includes(job.id)) return;

      if (!job.at) {
        throw new Error(`Invalid at for job ${job.id}`);
      }

      const delay = Math.max(0, job.at.getTime() - Date.now());
      const ref = setTimeout(() => {
        void this.recordJobRun(job, { isEnabled: false }).finally(() => {
          try {
            this.schedulerRegistry.deleteTimeout(job.id);
          } catch {
            // The timeout may already be gone if another path cleaned it up.
          }
        });
      }, delay);

      this.schedulerRegistry.addTimeout(job.id, ref);
    }
  }

  private stopRuntime(job: Job): void {
    if (job.type === 'cron') {
      const cronJobs = this.schedulerRegistry.getCronJobs();
      const runtimeJob = cronJobs.get(job.id);
      if (runtimeJob) void runtimeJob.stop();
      return;
    }

    if (job.type === 'every') {
      try {
        this.schedulerRegistry.deleteInterval(job.id);
      } catch {
        // The interval may already be gone if another path cleaned it up.
      }
      return;
    }

    if (job.type === 'at') {
      try {
        this.schedulerRegistry.deleteTimeout(job.id);
      } catch {
        // The timeout may already be gone if another path cleaned it up.
      }
    }
  }

  private createCronJob(job: Job): CronJob {
    const cronExpr = job.cron ?? '';
    return new CronJob(cronExpr, () => {
      void this.recordJobRun(job);
    });
  }

  private async recordJobRun(
    job: Job,
    extra: Partial<Pick<Job, 'isEnabled'>> = {},
  ): Promise<void> {
    this.logger.log(`run job ${job.id}, ${job.instruction}`);
    await this.entityManager.update(Job, job.id, {
      lastRun: new Date(),
      ...extra,
    });
  }
}
