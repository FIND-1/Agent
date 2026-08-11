import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';

/** Book 模块负责组装 HTTP 入口与 CRUD 服务；数据库连接由根模块统一注册。 */
@Module({
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
