import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'node:path';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';

/**
 * 复习重点：
 * AppModule 是 Nest 应用的根模块，负责把配置、静态资源和业务模块组装起来。
 *
 * 原文分析结论：
 * - Nest 用 Module 组织 Controller、Service 和其他 Provider
 * - imports 用来引入其他模块，被引入模块中的路由才会生效
 * - ConfigModule 设置 isGlobal 后，其他模块无需重复 imports 就能注入 ConfigService
 * - ServeStaticModule 可以把 public 目录中的 SSE 测试页作为静态资源提供
 *
 * 依赖条件：
 * - 从 hello-nest-langchain 目录启动，envFilePath 才会定位到工作区根目录 .env
 * - public 目录需要保留 sse-test.html
 */
@Module({
  imports: [
    // 所有 lesson 共用工作区根目录的模型配置，避免在每个子项目复制密钥。
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '..', '..', '..', '.env'),
    }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public') }),
    BookModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
