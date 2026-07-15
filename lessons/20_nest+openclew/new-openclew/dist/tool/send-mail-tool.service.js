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
exports.SendMailToolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mailer_1 = require("@nestjs-modules/mailer");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
let SendMailToolService = class SendMailToolService {
    tool;
    mailerService;
    configService;
    constructor() {
        const sendMailArgsSchema = zod_1.z.object({
            to: zod_1.z.email().describe('收件人邮箱地址，例如：someone@example.com'),
            subject: zod_1.z.string().describe('邮件主题'),
            text: zod_1.z.string().optional().describe('纯文本内容，可选'),
            html: zod_1.z.string().optional().describe('HTML 内容，可选'),
        });
        this.tool = (0, tools_1.tool)(async ({ to, subject, text, html, }) => {
            const fallbackFrom = this.configService.get('MAIL_FROM');
            await this.mailerService.sendMail({
                to,
                subject,
                text: text ?? '（无文本内容）',
                html: html ?? `<p>${text ?? '（无 HTML 内容）'}</p>`,
                from: fallbackFrom,
            });
            return `邮件已发送到 ${to}，主题为「${subject}」`;
        }, {
            name: 'send_mail',
            description: '发送电子邮件。需要提供收件人邮箱、主题，可选文本内容和 HTML 内容。',
            schema: sendMailArgsSchema,
        });
    }
};
exports.SendMailToolService = SendMailToolService;
__decorate([
    (0, common_1.Inject)(mailer_1.MailerService),
    __metadata("design:type", mailer_1.MailerService)
], SendMailToolService.prototype, "mailerService", void 0);
__decorate([
    (0, common_1.Inject)(config_1.ConfigService),
    __metadata("design:type", config_1.ConfigService)
], SendMailToolService.prototype, "configService", void 0);
exports.SendMailToolService = SendMailToolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SendMailToolService);
//# sourceMappingURL=send-mail-tool.service.js.map