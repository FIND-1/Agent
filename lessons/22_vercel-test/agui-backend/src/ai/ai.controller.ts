import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { pipeUIMessageStreamToResponse } from 'ai';
import type { UIMessage } from 'ai';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 复习重点：Controller 不解析 SSE chunk，只校验 UIMessage 数组并把协议流写入响应。
   * 相比普通 JSON 接口，它能持续输出文本和工具状态；真实调用需要模型 API。
   *
   * 本地测试（PowerShell）：
   * curl.exe -N -sS -X POST 'http://localhost:3000/ai/chat' `
   *   -H 'Content-Type: application/json' `
   *   -d '{\"messages\":[{\"id\":\"1\",\"role\":\"user\",\"parts\":[{\"type\":\"text\",\"text\":\"北京今天的天气\"}]}]}'
   */
  @Post('chat')
  async postChat(
    @Body() body: { messages?: UIMessage[] },
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (!body?.messages || !Array.isArray(body.messages)) {
      throw new BadRequestException('Invalid JSON');
    }

    const stream = await this.aiService.stream(body.messages);
    await pipeUIMessageStreamToResponse({ response: res, stream });
  }
}
