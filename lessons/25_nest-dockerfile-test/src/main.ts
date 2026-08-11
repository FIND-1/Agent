import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * 复习入口：创建根模块并监听端口。容器内默认监听 3000，宿主机端口由 Compose 映射。
 * 这里不负责等待 MySQL 就绪，因此数据库容器刚启动时应用仍可能连接失败。
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
