import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

/**
 * 复习重点：
 * LlmService 只负责根据配置创建 ChatOpenAI，让模型实例的创建逻辑离开业务 Service。
 *
 * 原文分析结论：
 * CHAT_MODEL 作为 Provider 导出后，AiService 和 JobAgentService 可以复用同一个模型能力。
 *
 * 依赖条件：
 * 需要根目录 .env 提供 OPENAI_API_KEY、OPENAI_BASE_URL 和 MODEL_NAME。
 */
@Injectable()
export class LlmService {
  @Inject(ConfigService)
  private readonly configService: ConfigService;

  getModel(): ChatOpenAI {
    return new ChatOpenAI({
      model: this.configService.get<string>('MODEL_NAME'),
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      configuration: {
        baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      },
    });
  }
}
