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

@Injectable()
export class AiService {
  private readonly chain: Runnable;

  constructor(
    @Inject('CHAT_MODEL') private readonly model: ChatOpenAI,
    private readonly configService: ConfigService,
  ) {
    const prompt = PromptTemplate.fromTemplate('请回答以下问题：\n\n{query}');
    this.chain = prompt.pipe(this.model).pipe(new StringOutputParser());
  }

  async runChain(query: string): Promise<string> {
    this.validateRequest(query);
    return this.chain.invoke({ query });
  }

  async *streamChain(query: string): AsyncGenerator<string> {
    this.validateRequest(query);
    const stream = await this.chain.stream({ query });

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
