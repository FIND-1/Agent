import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 复习重点：开发时前后端端口不同，因此开放 CORS；当前链路不使用 Cookie。
  app.enableCors({ origin: '*' });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
