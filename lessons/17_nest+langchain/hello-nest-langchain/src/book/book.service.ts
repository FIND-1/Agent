import { Inject, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * 复习重点：
 * BookService 展示属性注入；Controller 注入 Service 则展示构造器注入。
 *
 * 原文分析结论：
 * - @Injectable 让 class 可以由 Nest 容器管理
 * - @Inject(token) 按 token 取得 BookModule 中注册的 Provider
 * - 构造器注入和属性注入都可用，业务代码通常优先选择依赖更明确的构造器注入
 *
 * 依赖条件：
 * - BookService 必须和 BOOK_REPOSITORY Provider 位于同一模块作用域，或由模块导出后再导入
 */
@Injectable()
export class BookService {
  // 保留属性注入写法，用于对应博文中的第二种注入方式。
  @Inject('BOOK_REPOSITORY')
  private readonly bookRepository: any;

  create(createBookDto: CreateBookDto) {
    return 'This action adds a new book';
  }

  findAll() {
    // 不再返回脚手架占位字符串，改为调用注入的内存仓库。
    return this.bookRepository.findAll();
  }

  findOne(id: number) {
    return `This action returns a #${id} book`;
  }

  update(id: number, updateBookDto: UpdateBookDto) {
    return `This action updates a #${id} book`;
  }

  remove(id: number) {
    return `This action removes a #${id} book`;
  }
}
