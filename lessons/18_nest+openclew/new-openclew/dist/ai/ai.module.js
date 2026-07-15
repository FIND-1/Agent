"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const job_agent_service_1 = require("./job-agent.service");
const users_module_1 = require("../users/users.module");
const job_module_1 = require("../job/job.module");
const tool_module_1 = require("../tool/tool.module");
const sampleUsers = {
    '001': {
        id: '001',
        name: 'Zhang San',
        email: 'zhangsan@example.com',
        role: 'admin',
    },
    '002': {
        id: '002',
        name: 'Li Si',
        email: 'lisi@example.com',
        role: 'user',
    },
    '003': {
        id: '003',
        name: 'Wang Wu',
        email: 'wangwu@example.com',
        role: 'user',
    },
};
const queryUserArgsSchema = zod_1.z.object({
    userId: zod_1.z.string().describe('User ID, for example: 001, 002, 003'),
});
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, job_module_1.JobModule, tool_module_1.ToolModule],
        controllers: [ai_controller_1.AiController],
        providers: [
            ai_service_1.AiService,
            job_agent_service_1.JobAgentService,
            {
                provide: 'QUERY_USER_TOOL',
                useFactory: () => (0, tools_1.tool)(({ userId }) => {
                    const user = sampleUsers[userId];
                    if (!user) {
                        return `User ID ${userId} does not exist. Available IDs: ${Object.keys(sampleUsers).join(', ')}`;
                    }
                    return `User info:
- ID: ${user.id}
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}`;
                }, {
                    name: 'query_user',
                    description: 'Query sample user information by user ID.',
                    schema: queryUserArgsSchema,
                }),
            },
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map