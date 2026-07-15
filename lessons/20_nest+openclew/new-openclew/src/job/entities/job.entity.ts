import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type JobType = 'cron' | 'every' | 'at';

/**
 * 复习重点：
 * Job 是定时任务的持久化模型，保存“什么时候执行”和“执行什么”的拆分结果。
 *
 * 原文分析结论：
 * OpenClaw 同类能力可以抽象成 cron、every、at 三种任务；运行时对象可以丢，但数据库记录要保留。
 *
 * 依赖条件：
 * id 同时作为数据库主键和 SchedulerRegistry 里的任务名，必须保持唯一。
 */
@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  instruction: string;

  @Column({ type: 'varchar', length: 10, default: 'cron' })
  type: JobType = 'cron';

  // cron 类型使用（Cron 表达式）
  @Column({ type: 'varchar', length: 100, nullable: true })
  cron: string | null;

  // every 类型使用（间隔毫秒）
  @Column({ type: 'int', nullable: true })
  everyMs: number | null;

  // at 类型使用（指定触发时间点）
  @Column({ type: 'timestamp', nullable: true })
  at: Date | null;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRun: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
