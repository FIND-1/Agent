import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AppTool } from './tool.types';

/**
 * 复习重点：
 * send_mail 把邮件发送能力封装成模型可调用的 tool。
 *
 * 原文分析结论：
 * 定时任务到点后如果 instruction 是“给某人发邮件”，后台 JobAgent 应该再决定调用这个工具。
 *
 * 依赖条件：
 * 依赖 MailerModule 的 SMTP 配置；缺少 MAIL_* 配置时只能验证结构，不能验证真实发信。
 */
@Injectable()
export class SendMailToolService {
  readonly tool: AppTool;

  @Inject(MailerService)
  private readonly mailerService: MailerService;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  constructor() {
    const sendMailArgsSchema = z.object({
      to: z.email().describe('收件人邮箱地址，例如：someone@example.com'),
      subject: z.string().describe('邮件主题'),
      text: z.string().optional().describe('纯文本内容，可选'),
      html: z.string().optional().describe('HTML 内容，可选'),
    });

    this.tool = tool(
      async ({
        to,
        subject,
        text,
        html,
      }: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
      }) => {
        const fallbackFrom = this.configService.get<string>('MAIL_FROM');

        await this.mailerService.sendMail({
          to,
          subject,
          text: text ?? '（无文本内容）',
          html: html ?? `<p>${text ?? '（无 HTML 内容）'}</p>`,
          from: fallbackFrom,
        });

        return `邮件已发送到 ${to}，主题为「${subject}」`;
      },
      {
        name: 'send_mail',
        description:
          '发送电子邮件。需要提供收件人邮箱、主题，可选文本内容和 HTML 内容。',
        schema: sendMailArgsSchema,
      },
    );
  }
}
