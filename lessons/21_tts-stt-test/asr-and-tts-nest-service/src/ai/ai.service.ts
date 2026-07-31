import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type { Runnable } from '@langchain/core/runnables';
import { AI_TTS_STREAM_EVENT } from '../common/stream-events';

@Injectable()
export class AiService {
  private readonly chain: Runnable;

  constructor(
    @Inject('CHAT_MODEL') model: ChatOpenAI,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const prompt = PromptTemplate.fromTemplate(
      '请简洁、自然地回答以下问题：\n\n{query}',
    );
    this.chain = prompt.pipe(model).pipe(new StringOutputParser());
  }

  /**
   * 同一份模型 chunk 一路返回 SSE，一路通过事件交给 TTS relay。
   * sessionId 为空时只返回文字，方便在没有语音服务时降级复习。
   */
  async *streamChain(
    query: string,
    sessionId?: string,
  ): AsyncGenerator<string> {
    if (sessionId) {
      this.eventEmitter.emit(AI_TTS_STREAM_EVENT, {
        type: 'start',
        sessionId,
        query,
      });
    }

    try {
      const stream = await this.chain.stream({ query });
      for await (const chunk of stream) {
        if (sessionId) {
          this.eventEmitter.emit(AI_TTS_STREAM_EVENT, {
            type: 'chunk',
            sessionId,
            chunk,
          });
        }
        yield chunk;
      }
      if (sessionId) {
        this.eventEmitter.emit(AI_TTS_STREAM_EVENT, {
          type: 'end',
          sessionId,
        });
      }
    } catch (error) {
      if (sessionId) {
        this.eventEmitter.emit(AI_TTS_STREAM_EVENT, {
          type: 'error',
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }
}
