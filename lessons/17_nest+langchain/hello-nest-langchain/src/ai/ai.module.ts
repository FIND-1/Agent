import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const baseURL = configService.get<string>('OPENAI_BASE_URL');

        return new ChatOpenAI({
          apiKey: configService.get<string>('OPENAI_API_KEY') ?? '',
          model: configService.get<string>('MODEL_NAME') ?? 'qwen-plus',
          temperature: 0.7,
          configuration: baseURL ? { baseURL } : undefined,
        });
      },
    },
  ],
})
export class AiModule {}
