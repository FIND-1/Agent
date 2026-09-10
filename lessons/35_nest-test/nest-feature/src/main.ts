/** 复习 00：NestFactory 创建容器与 HTTP 应用。这里的中间件覆盖请求结束日志；与拦截器日志并存，成功请求会打印两组日志。仅手动运行本入口才监听 PORT（默认 3000），不依赖数据库。 */
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, originalUrl } = request;
    console.log(`[请求] ${new Date().toISOString()} ${method} ${originalUrl}`);

    // 响应发送完毕后记录耗时，包括参数校验失败和未匹配路由的响应。
    response.once('finish', () => {
      console.log(
        `[响应] ${new Date().toISOString()} ${method} ${originalUrl} 耗时 ${Date.now() - startTime}ms`,
      );
    });
    next();
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`应用已启动：${await app.getUrl()}`);
}
bootstrap().catch((error: unknown) => {
  console.error('应用启动失败:', error);
  process.exitCode = 1;
});
