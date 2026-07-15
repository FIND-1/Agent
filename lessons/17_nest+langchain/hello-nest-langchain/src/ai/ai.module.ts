import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

/**
 * 复习重点：
 * AiModule 用 useFactory 创建 ChatModel Provider，把模型实例的创建从 AiService 中拆出去。
 *
 * 原文分析结论：
 * - ChatModel 是可注入的基础能力，不应由每次请求临时创建
 * - useFactory 可以注入 ConfigService，再根据环境变量动态创建模型
 * - AiService 只依赖 CHAT_MODEL token，因此业务逻辑与具体模型配置解耦
 * - 更换模型名、API 地址或模型工厂时，不需要修改 Controller
 *
 * 依赖条件：
 * - 需要 OPENAI_API_KEY
 * - OPENAI_BASE_URL 可指向兼容 OpenAI 协议的模型服务
 * - MODEL_NAME 未配置时默认使用 qwen-plus
 * - 当前 CommonJS 项目通过动态 import 复用 lessons/_shared/model.mjs
 */
type CreateChatModel = (
  options?: ConstructorParameters<typeof ChatOpenAI>[0],
) => ChatOpenAI;

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
        // Provider 在模块初始化时创建一次，后续请求复用同一个模型实例。
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
