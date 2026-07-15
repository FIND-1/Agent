"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolModule = void 0;
const common_1 = require("@nestjs/common");
const users_module_1 = require("../users/users.module");
const llm_service_1 = require("./llm.service");
const send_mail_tool_service_1 = require("./send-mail-tool.service");
const web_search_tool_service_1 = require("./web-search-tool.service");
const db_users_crud_tool_service_1 = require("./db-users-crud-tool.service");
const time_now_tool_service_1 = require("./time-now-tool.service");
const cron_job_tool_service_1 = require("./cron-job-tool.service");
const job_module_1 = require("../job/job.module");
let ToolModule = class ToolModule {
};
exports.ToolModule = ToolModule;
exports.ToolModule = ToolModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, (0, common_1.forwardRef)(() => job_module_1.JobModule)],
        providers: [
            llm_service_1.LlmService,
            send_mail_tool_service_1.SendMailToolService,
            web_search_tool_service_1.WebSearchToolService,
            db_users_crud_tool_service_1.DbUsersCrudToolService,
            time_now_tool_service_1.TimeNowToolService,
            cron_job_tool_service_1.CronJobToolService,
            {
                provide: 'CHAT_MODEL',
                useFactory: (llmService) => llmService.getModel(),
                inject: [llm_service_1.LlmService],
            },
            {
                provide: 'SEND_MAIL_TOOL',
                useFactory: (svc) => svc.tool,
                inject: [send_mail_tool_service_1.SendMailToolService],
            },
            {
                provide: 'WEB_SEARCH_TOOL',
                useFactory: (svc) => svc.tool,
                inject: [web_search_tool_service_1.WebSearchToolService],
            },
            {
                provide: 'DB_USERS_CRUD_TOOL',
                useFactory: (svc) => svc.tool,
                inject: [db_users_crud_tool_service_1.DbUsersCrudToolService],
            },
            {
                provide: 'TIME_NOW_TOOL',
                useFactory: (svc) => svc.tool,
                inject: [time_now_tool_service_1.TimeNowToolService],
            },
            {
                provide: 'CRON_JOB_TOOL',
                useFactory: (svc) => svc.tool,
                inject: [cron_job_tool_service_1.CronJobToolService],
            },
        ],
        exports: [
            'CHAT_MODEL',
            'SEND_MAIL_TOOL',
            'WEB_SEARCH_TOOL',
            'DB_USERS_CRUD_TOOL',
            'TIME_NOW_TOOL',
            'CRON_JOB_TOOL',
        ],
    })
], ToolModule);
//# sourceMappingURL=tool.module.js.map