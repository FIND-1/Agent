import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';

/**
 * 复习重点：
 * BookModule 用一个最小 CRUD 模块演示 Nest 的模块组织和依赖注入。
 *
 * 原文分析结论：
 * - controllers 声明本模块负责的路由入口
 * - providers 声明可由 Nest 容器创建和注入的能力
 * - Provider 不只可以是 @Injectable class，也可以由 useFactory 返回普通对象
 * - provide 是注入 token，消费方通过 @Inject('BOOK_REPOSITORY') 获取实例
 *
 * 依赖条件：
 * - 本示例使用内存 mock 仓库，不需要数据库或外部服务
 * - 进程重启后内存数据会恢复为初始值
 */
@Module({
  controllers: [BookController],
  providers: [
    BookService,
    {
      // token 把“仓库能力”与具体实现关联起来，Service 不需要手动 new 仓库。
      provide: 'BOOK_REPOSITORY',
      useFactory() {
        // 内存 mock 仓库，适合测试，无需外部依赖
        const books: { id: number; title: string }[] = [
          { id: 1, title: 'Book 1' },
          { id: 2, title: 'Book 2' },
          { id: 3, title: 'Book 3' },
        ];
        return {
          findAll: () => [...books],
        };
      },
    },
  ],
})
export class BookModule {}
