export type JobType = 'cron' | 'every' | 'at';
export declare class Job {
    id: string;
    instruction: string;
    type: JobType;
    cron: string | null;
    everyMs: number | null;
    at: Date | null;
    isEnabled: boolean;
    lastRun: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
