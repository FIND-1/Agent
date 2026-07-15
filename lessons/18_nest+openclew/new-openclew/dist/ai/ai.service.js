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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const tool_types_1 = require("../tool/tool.types");
let AiService = class AiService {
    queryUserTool;
    sendMailTool;
    webSearchTool;
    dbUsersCrudTool;
    timeNowTool;
    cronJobTool;
    modelWithTools;
    constructor(model, queryUserTool, sendMailTool, webSearchTool, dbUsersCrudTool, timeNowTool, cronJobTool) {
        this.queryUserTool = queryUserTool;
        this.sendMailTool = sendMailTool;
        this.webSearchTool = webSearchTool;
        this.dbUsersCrudTool = dbUsersCrudTool;
        this.timeNowTool = timeNowTool;
        this.cronJobTool = cronJobTool;
        this.modelWithTools = model.bindTools([
            this.queryUserTool,
            this.sendMailTool,
            this.webSearchTool,
            this.dbUsersCrudTool,
            this.timeNowTool,
            this.cronJobTool,
        ]);
    }
    async runChain(query) {
        const messages = [
            new messages_1.SystemMessage(`你是一个通用任务助手，可以根据用户的目标规划步骤，并在需要时调用工具：\`query_user\` 查询或校验用户信息、\`send_mail\` 发送邮件、\`web_search\` 进行互联网搜索、\`db_users_crud\` 读写数据库 users 表、\`time_now\` 获取当前服务器时间、\`cron_job\` 创建和管理定时/周期任务（\`list\`/\`add\`/\`toggle\`），从而实现提醒、定期任务、数据同步等各种自动化需求。

定时任务类型选择规则（非常重要）：
- 用户说“X分钟/小时/天后”“在某个时间点”“到点提醒”（一次性）=> 用 \`cron_job\` + \`type=at\`（执行一次后自动停用），\`at\`=当前时间+X 或解析出的时间点
- 用户说“每X分钟/每小时/每天”“定期/循环/一直”（重复执行）=> 用 \`cron_job\` + \`type=every\`（每次执行），\`everyMs\`=X换算成毫秒
- 用户给出 Cron 表达式或明确说“用 cron 表达式”（重复执行）=> 用 \`cron_job\` + \`type=cron\`

在调用 \`cron_job.add\` 创建任务时，需要把用户原始自然语言拆成两部分：一部分是“什么时候执行”（用来决定 type/at/everyMs/cron），另一部分是“要做什么任务本身”。\`instruction\` 字段只能填“要做什么”的那部分文本（保持原语言和原话），不能再改写、翻译或总结。

当用户请求“在未来某个时间点执行某个动作”（例如“1分钟后给我发一个笑话到邮箱”）时，本轮对话只需要使用 \`cron_job\` 设置/更新定时任务，不要在当前轮直接完成这个动作本身：不要直接调用 \`send_mail\` 给他发邮件，也不要在当前轮就真正“执行”指令，只需把要执行的动作写进 \`instruction\` 里，交给将来的定时任务去跑。

重要：\`cron_job.add\` 的 \`instruction\` 必须是自然语言任务描述，不能写成工具调用/脚本（例如禁止 \`send_mail(...)\`、\`db_users_crud(...)\`、\`web_search(...)\`）。工具调用应该由将来的 JobAgent 在执行时自行决定。

注意：像“\`1分钟后提醒我喝水\`”，时间相关信息用于计算下一次执行时间，而 \`instruction\` 应该是“提醒我喝水”；本轮不需要立刻提醒。`),
            new messages_1.HumanMessage(query),
        ];
        while (true) {
            const aiMessage = await this.modelWithTools.invoke(messages);
            messages.push(aiMessage);
            const toolCalls = aiMessage.tool_calls ?? [];
            if (!toolCalls.length) {
                return (0, tool_types_1.toToolMessageContent)(aiMessage.content);
            }
            for (const toolCall of toolCalls) {
                const toolCallId = toolCall.id || '';
                const toolName = toolCall.name;
                if (toolName === 'query_user') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.queryUserTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'send_mail') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.sendMailTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'web_search') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.webSearchTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'db_users_crud') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.dbUsersCrudTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'time_now') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.timeNowTool, {});
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'cron_job') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.cronJobTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
            }
        }
    }
    async *runChainStream(query) {
        const messages = [
            new messages_1.SystemMessage(`你是一个通用任务助手，可以在需要时调用工具（如 \`query_user\`、\`db_users_crud\`、\`send_mail\`、\`web_search\`、\`time_now\`、\`cron_job\` 等）来查询或改写数据/配置，规划并执行各种任务（包括提醒、定期任务和一系列后台操作），再用结果回答用户的问题。

定时任务类型选择规则（非常重要）：
- “X分钟/小时/天后”“在某个时间点”“到点提醒”（一次性）=> \`cron_job.type=at\`（执行一次后自动停用）
- “每X分钟/每小时/每天”“定期/循环/一直”（重复执行）=> \`cron_job.type=every\`（每次执行），\`everyMs\`=毫秒
- 给出 Cron 表达式 => \`cron_job.type=cron\``),
            new messages_1.HumanMessage(query),
        ];
        while (true) {
            const stream = await this.modelWithTools.stream(messages);
            let fullAIMessage = null;
            for await (const chunk of stream) {
                fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;
                const isToolCalling = (fullAIMessage.tool_call_chunks?.length ?? 0) > 0;
                if (!isToolCalling && chunk.content) {
                    yield chunk.content;
                }
            }
            if (!fullAIMessage) {
                return;
            }
            messages.push(fullAIMessage);
            const toolCalls = fullAIMessage.tool_calls ?? [];
            if (!toolCalls.length) {
                return;
            }
            for (const toolCall of toolCalls) {
                const toolCallId = toolCall.id || '';
                const toolName = toolCall.name;
                if (toolName === 'query_user') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.queryUserTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'send_mail') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.sendMailTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'web_search') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.webSearchTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'db_users_crud') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.dbUsersCrudTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'time_now') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.timeNowTool, {});
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
                else if (toolName === 'cron_job') {
                    const result = await (0, tool_types_1.invokeAppTool)(this.cronJobTool, toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        name: toolName,
                        content: result,
                    }));
                }
            }
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('CHAT_MODEL')),
    __param(1, (0, common_1.Inject)('QUERY_USER_TOOL')),
    __param(2, (0, common_1.Inject)('SEND_MAIL_TOOL')),
    __param(3, (0, common_1.Inject)('WEB_SEARCH_TOOL')),
    __param(4, (0, common_1.Inject)('DB_USERS_CRUD_TOOL')),
    __param(5, (0, common_1.Inject)('TIME_NOW_TOOL')),
    __param(6, (0, common_1.Inject)('CRON_JOB_TOOL')),
    __metadata("design:paramtypes", [openai_1.ChatOpenAI, Object, Object, Object, Object, Object, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map