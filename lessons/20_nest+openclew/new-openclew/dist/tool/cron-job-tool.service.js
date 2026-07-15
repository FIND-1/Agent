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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronJobToolService = void 0;
const common_1 = require("@nestjs/common");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const job_service_1 = require("../job/job.service");
let CronJobToolService = class CronJobToolService {
    tool;
    jobService;
    constructor() {
        const cronJobArgsSchema = zod_1.z.object({
            action: zod_1.z
                .enum(['list', 'add', 'toggle'])
                .describe('Action to run: list, add, toggle'),
            id: zod_1.z.string().optional().describe('Job ID for toggle'),
            enabled: zod_1.z
                .boolean()
                .optional()
                .describe('Whether the job should be enabled'),
            type: zod_1.z
                .enum(['cron', 'every', 'at'])
                .optional()
                .describe('Job type for add'),
            instruction: zod_1.z
                .string()
                .optional()
                .describe('Natural-language instruction for add'),
            cron: zod_1.z.string().optional().describe('Cron expression for type=cron'),
            everyMs: zod_1.z
                .number()
                .int()
                .positive()
                .optional()
                .describe('Interval in milliseconds for type=every'),
            at: zod_1.z.string().optional().describe('ISO timestamp for type=at'),
        });
        this.tool = (0, tools_1.tool)(async ({ action, id, enabled, type, instruction, cron, everyMs, at, }) => {
            switch (action) {
                case 'list': {
                    const jobs = await this.jobService.listJobs();
                    if (!jobs.length)
                        return 'There are no scheduled jobs.';
                    const lines = jobs
                        .map((job) => {
                        const atText = job.at instanceof Date
                            ? job.at.toISOString()
                            : (job.at ?? '');
                        return `id=${job.id} type=${job.type} enabled=${job.isEnabled} running=${job.running} cron=${job.cron ?? ''} everyMs=${job.everyMs ?? ''} at=${atText} instruction=${job.instruction}`;
                    })
                        .join('\n');
                    return `Scheduled jobs:\n${lines}`;
                }
                case 'add': {
                    if (!type)
                        return 'Adding a job requires type.';
                    if (!instruction)
                        return 'Adding a job requires instruction.';
                    if (type === 'cron') {
                        if (!cron)
                            return 'type=cron requires cron.';
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
                    if (!at)
                        return 'type=at requires at.';
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
                    if (!id)
                        return 'Toggling a job requires id.';
                    const updated = await this.jobService.toggleJob(id, enabled);
                    return `Updated job: id=${updated.id} enabled=${updated.isEnabled}`;
                }
            }
        }, {
            name: 'cron_job',
            description: 'Manage scheduled jobs. Supports list, add, and toggle.',
            schema: cronJobArgsSchema,
        });
    }
};
exports.CronJobToolService = CronJobToolService;
__decorate([
    (0, common_1.Inject)(job_service_1.JobService),
    __metadata("design:type", job_service_1.JobService)
], CronJobToolService.prototype, "jobService", void 0);
exports.CronJobToolService = CronJobToolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CronJobToolService);
//# sourceMappingURL=cron-job-tool.service.js.map