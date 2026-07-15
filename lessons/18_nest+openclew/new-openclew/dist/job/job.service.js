"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JobService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const typeorm_1 = require("typeorm");
const job_entity_1 = require("./entities/job.entity");
let JobService = JobService_1 = class JobService {
    logger = new common_1.Logger(JobService_1.name);
    entityManager;
    schedulerRegistry;
    async onApplicationBootstrap() {
        const enabledJobs = await this.entityManager.find(job_entity_1.Job, {
            where: { isEnabled: true },
        });
        const cronJobs = this.schedulerRegistry.getCronJobs();
        const intervals = this.schedulerRegistry.getIntervals();
        const timeouts = this.schedulerRegistry.getTimeouts();
        for (const job of enabledJobs) {
            const alreadyRegistered = (job.type === 'cron' && cronJobs.has(job.id)) ||
                (job.type === 'every' && intervals.includes(job.id)) ||
                (job.type === 'at' && timeouts.includes(job.id));
            if (!alreadyRegistered) {
                this.startRuntime(job);
            }
        }
    }
    async listJobs() {
        const jobs = await this.entityManager.find(job_entity_1.Job, {
            order: { createdAt: 'DESC' },
        });
        const cronJobs = this.schedulerRegistry.getCronJobs();
        const intervalNames = this.schedulerRegistry.getIntervals();
        const timeoutNames = this.schedulerRegistry.getTimeouts();
        return jobs.map((job) => {
            const running = job.isEnabled &&
                ((job.type === 'cron' && cronJobs.has(job.id)) ||
                    (job.type === 'every' && intervalNames.includes(job.id)) ||
                    (job.type === 'at' && timeoutNames.includes(job.id)));
            return {
                ...job,
                running,
            };
        });
    }
    async addJob(input) {
        const entity = this.entityManager.create(job_entity_1.Job, {
            instruction: input.instruction,
            type: input.type,
            cron: input.type === 'cron' ? input.cron : null,
            everyMs: input.type === 'every' ? input.everyMs : null,
            at: input.type === 'at' ? input.at : null,
            isEnabled: input.isEnabled ?? true,
            lastRun: null,
        });
        const saved = await this.entityManager.save(job_entity_1.Job, entity);
        if (saved.isEnabled) {
            this.startRuntime(saved);
        }
        return saved;
    }
    async toggleJob(jobId, enabled) {
        const job = await this.entityManager.findOne(job_entity_1.Job, { where: { id: jobId } });
        if (!job) {
            throw new common_1.NotFoundException(`Job not found: ${jobId}`);
        }
        const nextEnabled = enabled ?? !job.isEnabled;
        if (job.isEnabled !== nextEnabled) {
            job.isEnabled = nextEnabled;
            await this.entityManager.save(job_entity_1.Job, job);
        }
        if (job.isEnabled) {
            this.startRuntime(job);
        }
        else {
            this.stopRuntime(job);
        }
        return job;
    }
    startRuntime(job) {
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
            if (names.includes(job.id))
                return;
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
            if (names.includes(job.id))
                return;
            if (!job.at) {
                throw new Error(`Invalid at for job ${job.id}`);
            }
            const delay = Math.max(0, job.at.getTime() - Date.now());
            const ref = setTimeout(() => {
                void this.recordJobRun(job, { isEnabled: false }).finally(() => {
                    try {
                        this.schedulerRegistry.deleteTimeout(job.id);
                    }
                    catch {
                    }
                });
            }, delay);
            this.schedulerRegistry.addTimeout(job.id, ref);
        }
    }
    stopRuntime(job) {
        if (job.type === 'cron') {
            const cronJobs = this.schedulerRegistry.getCronJobs();
            const runtimeJob = cronJobs.get(job.id);
            if (runtimeJob)
                void runtimeJob.stop();
            return;
        }
        if (job.type === 'every') {
            try {
                this.schedulerRegistry.deleteInterval(job.id);
            }
            catch {
            }
            return;
        }
        if (job.type === 'at') {
            try {
                this.schedulerRegistry.deleteTimeout(job.id);
            }
            catch {
            }
        }
    }
    createCronJob(job) {
        const cronExpr = job.cron ?? '';
        return new cron_1.CronJob(cronExpr, () => {
            void this.recordJobRun(job);
        });
    }
    async recordJobRun(job, extra = {}) {
        this.logger.log(`run job ${job.id}, ${job.instruction}`);
        await this.entityManager.update(job_entity_1.Job, job.id, {
            lastRun: new Date(),
            ...extra,
        });
    }
};
exports.JobService = JobService;
__decorate([
    (0, common_1.Inject)(typeorm_1.EntityManager),
    __metadata("design:type", typeorm_1.EntityManager)
], JobService.prototype, "entityManager", void 0);
__decorate([
    (0, common_1.Inject)(schedule_1.SchedulerRegistry),
    __metadata("design:type", schedule_1.SchedulerRegistry)
], JobService.prototype, "schedulerRegistry", void 0);
exports.JobService = JobService = JobService_1 = __decorate([
    (0, common_1.Injectable)()
], JobService);
//# sourceMappingURL=job.service.js.map