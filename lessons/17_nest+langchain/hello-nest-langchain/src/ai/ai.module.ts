import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

type CreateChatModel = (options?: ConstructorParameters<typeof ChatOpenAI>[0]) => ChatOpenAI;

async function loadCreateChatModel(): Promise<CreateChatModel> {
  // 本项目以 CommonJS 编译，而共享工厂是 ESM (.mjs)，因此通过动态导入复用它。
  const sharedModelUrl = pathToFileURL(
    join(__dirname, '../../../../_shared/model.mjs'),
  ).href;
  const sharedModel = (await import(sharedModelUrl)) as {
    createChatModel: CreateChatModel;
  };

  return sharedModel.createChatModel;
}

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const baseURL = configService.get<string>('OPENAI_BASE_URL');
        const createChatModel = await loadCreateChatModel();

        return createChatModel({
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
