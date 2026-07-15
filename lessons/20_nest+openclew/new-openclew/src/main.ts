import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * 复习重点：
 * main.ts 是 Nest 应用的最小启动入口，只负责创建应用实例并监听端口。
 *
 * 原文分析结论：
 * 本课重点在 tool、数据库和定时任务链路，启动入口保持简单即可。
 *
 * 依赖条件：
 * 当前没有注册全局 ValidationPipe，所以 DTO 上的 class-validator 装饰器不会自动校验 HTTP 请求体。
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
