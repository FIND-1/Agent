/** 复习 02：PartialType 复用创建 DTO 并允许部分更新；它不代替运行时验证或更新字段白名单。 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
