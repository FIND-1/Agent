import { NestFactory } from '@nestjs/core';
import { WebSocketServer } from 'ws';
import { AppModule } from './app.module';
import { TtsRelayService } from './speech/tts-relay.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const ttsRelayService = app.get(TtsRelayService);
  const ttsServer = new WebSocketServer({
    server: app.getHttpServer(),
    path: '/tts',
  });

  /**
   * 浏览器只连接本地 /tts；TtsRelayService 再把 AI 文本转发给腾讯云。
   * 文本继续走 SSE，二进制音频单独走 WebSocket，避免 Base64 放大数据量。
   */
  ttsServer.on('connection', (clientWs, request) => {
    const requestUrl = new URL(request.url ?? '/tts', 'http://localhost');
    const sessionId = ttsRelayService.registerClient(
      clientWs,
      requestUrl.searchParams.get('sessionId') ?? undefined,
    );
    clientWs.on('close', () => ttsRelayService.unregisterClient(sessionId));
  });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
