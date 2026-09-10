// 综合应用入口：比独立脚本多出 HTTP 请求校验和服务生命周期。
// 启动会监听 PORT（默认 3000）；复习时先做静态检查，端口由用户管理。
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
