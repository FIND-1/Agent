import { Controller, Get, MessageEvent, Query, Sse } from '@nestjs/common';
import { concat, from, map, Observable, of } from 'rxjs';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('chat')
  async chat(@Query('query') query: string) {
    const answer = await this.aiService.runChain(query);
    return { answer };
  }

  @Sse('chat/stream')
  chatStream(@Query('query') query: string): Observable<MessageEvent> {
    return concat(
      from(this.aiService.streamChain(query)).pipe(
        map((data): MessageEvent => ({ data })),
      ),
      of({ type: 'done', data: 'done' }),
    );
  }
}
