import { OnApplicationBootstrap } from '@nestjs/common';
import { Job } from './entities/job.entity';
export type JobWithRunning = Job & {
    running: boolean;
};
export declare class JobService implements OnApplicationBootstrap {
    private readonly logger;
    private readonly entityManager;
    private readonly schedulerRegistry;
    onApplicationBootstrap(): Promise<void>;
    listJobs(): Promise<JobWithRunning[]>;
    addJob(input: {
        type: 'cron';
        instruction: string;
        cron: string;
        isEnabled?: boolean;
    } | {
        type: 'every';
        instruction: string;
        everyMs: number;
        isEnabled?: boolean;
    } | {
        type: 'at';
        instruction: string;
        at: Date;
        isEnabled?: boolean;
    }): Promise<Job>;
    toggleJob(jobId: string, enabled?: boolean): Promise<Job>;
    private startRuntime;
    private stopRuntime;
    private createCronJob;
    private recordJobRun;
}
