import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

/** PartialType 将创建字段全部变为可选，正好对应 PATCH 的部分更新语义。 */
export class UpdateBookDto extends PartialType(CreateBookDto) {}
