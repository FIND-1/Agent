import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // src 与编译后的 dist 位于同一层级，固定读取仓库根 .env，不依赖启动目录。
      envFilePath: join(__dirname, '..', '..', '..', '..', '.env'),
    }),
    ServeStaticModule.forRoot({
      // 页面位于 ai-canvas/public；从 src / dist 向上一级定位，不依赖启动目录。
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/ai/*path'],
    }),
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
