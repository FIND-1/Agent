import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * 复习重点：
 * UpdateUserDto 复用 CreateUserDto 的字段规则，但把字段都变成可选。
 *
 * 原文分析结论：
 * PATCH 更新通常只提交要变化的字段，不应要求 name 和 email 同时存在。
 *
 * 依赖条件：
 * PartialType 只负责类型和元数据复用，运行时校验仍依赖 ValidationPipe。
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
