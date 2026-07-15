import { Controller, Get, MessageEvent, Query, Sse } from '@nestjs/common';
import { concat, from, map, Observable, of } from 'rxjs';
import { AiService } from './ai.service';

/**
 * 复习重点：
 * AiController 只处理 HTTP 边界：读取 query、调用 Service、组织普通响应或 SSE 事件流。
 *
 * 原文分析结论：
 * - @Get 返回等待完整结果的普通 JSON 接口
 * - @Sse 自动把响应 Content-Type 设置为 text/event-stream
 * - from 可以把 AsyncGenerator 转换为 RxJS Observable
 * - map 把字符串 chunk 转换为 Nest 需要的 MessageEvent，即 { data }
 * - concat 在模型流结束后追加 done 事件，让浏览器主动关闭连接
 *
 * 依赖条件：
 * - 普通接口：GET /ai/chat?query=问题
 * - 流式接口：GET /ai/chat/stream?query=问题
 * - EventSource 只能发起 GET，请求参数需要放在 URL 中
 */
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
      // AsyncGenerator -> Observable<string> -> Observable<MessageEvent>。
      from(this.aiService.streamChain(query)).pipe(
        map((data): MessageEvent => ({ data })),
      ),
      // done 是本示例约定的自定义 SSE 事件，不是协议自动产生的事件。
      of({ type: 'done', data: 'done' }),
    );
  }
}
