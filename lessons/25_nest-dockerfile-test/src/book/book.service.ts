import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';

@Injectable()
export class BookService {
  /**
   * EntityManager 展示 TypeORM 的通用 CRUD 调用链。
   * 所有方法都依赖可用的 MySQL；未连接数据库时只能做静态阅读、构建和类型检查。
   */
  @Inject(EntityManager)
  private readonly entityManager!: EntityManager;

  async create(createBookDto: CreateBookDto) {
    const book = this.entityManager.create(Book, {
      ...createBookDto,
      publishedAt: new Date(createBookDto.publishedAt),
    });
    return this.entityManager.save(Book, book);
  }

  async findAll() {
    return this.entityManager.find(Book, {
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const book = await this.entityManager.findOneBy(Book, { id });
    if (!book) {
      throw new NotFoundException(`Book #${id} not found`);
    }
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    const { publishedAt, ...restPayload } = updateBookDto;
    const updatePayload: Partial<Book> = { ...restPayload };

    // PATCH 允许只更新部分字段；只有显式传入日期时才执行字符串到 Date 的转换。
    if (publishedAt !== undefined) {
      updatePayload.publishedAt = new Date(publishedAt);
    }

    const mergedBook = this.entityManager.merge(Book, book, updatePayload);
    return this.entityManager.save(Book, mergedBook);
  }

  async remove(id: number) {
    const book = await this.findOne(id);
    await this.entityManager.remove(Book, book);
    return { deleted: true };
  }
}
