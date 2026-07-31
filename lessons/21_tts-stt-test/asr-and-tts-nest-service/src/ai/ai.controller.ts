import { BadRequestException, Controller, Query, Sse } from '@nestjs/common';
import { from, map, type Observable } from 'rxjs';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Sse('chat/stream')
  chatStream(
    @Query('query') query = '',
    @Query('sessionId') sessionId?: string,
  ): Observable<{ data: string }> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('query 不能为空');
    }

    return from(
      this.aiService.streamChain(normalizedQuery, sessionId?.trim()),
    ).pipe(map((chunk) => ({ data: chunk })));
  }
}
