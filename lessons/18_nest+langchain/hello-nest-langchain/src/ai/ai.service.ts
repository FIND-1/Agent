import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type { Runnable } from '@langchain/core/runnables';

/**
 * 复习重点：
 * AiService 负责组装并调用 LangChain Chain，同时提供完整返回和流式返回两种方式。
 *
 * 原文分析结论：
 * - PromptTemplate、ChatModel、StringOutputParser 都是 Runnable
 * - 这些 Runnable 可以通过 pipe 组装成一条可复用的 chain
 * - invoke 等待完整结果，适合普通 JSON 接口
 * - stream 持续产生 chunk，适合 SSE 流式接口
 * - async generator 用 for await...of 读取流，再通过 yield 逐块交给 Controller
 *
 * 依赖条件：
 * - AiModule 必须注册 CHAT_MODEL Provider
 * - 需要有效的 OPENAI_API_KEY、模型名和兼容接口地址
 * - query 不能为空
 */
@Injectable()
export class AiService {
  private readonly chain: Runnable;

  constructor(
    @Inject('CHAT_MODEL') private readonly model: ChatOpenAI,
    private readonly configService: ConfigService,
  ) {
    const prompt = PromptTemplate.fromTemplate('请回答以下问题：\n\n{query}');

    // Chain 在 Service 创建时组装一次，避免每次 HTTP 请求都重复创建。
    this.chain = prompt.pipe(this.model).pipe(new StringOutputParser());
  }

  async runChain(query: string): Promise<string> {
    this.validateRequest(query);

    // invoke 会等待模型生成完成，再一次性返回字符串。
    return this.chain.invoke({ query });
  }

  async *streamChain(query: string): AsyncGenerator<string> {
    this.validateRequest(query);
    const stream = await this.chain.stream({ query });

    // 每次 yield 一个 chunk，Controller 就能继续向 SSE 客户端推送一段内容。
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  private validateRequest(query: string): void {
    if (!query?.trim()) {
      throw new BadRequestException('query 不能为空');
    }

    if (!this.configService.get<string>('OPENAI_API_KEY')?.trim()) {
      throw new ServiceUnavailableException(
        '缺少 OPENAI_API_KEY，请在 .env 中配置后重启服务',
      );
    }
  }
}
