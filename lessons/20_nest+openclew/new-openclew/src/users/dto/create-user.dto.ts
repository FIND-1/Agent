import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * 复习重点：
 * DTO 描述创建用户时允许接收的字段，并把校验规则靠近入参模型。
 *
 * 原文分析结论：
 * id、createdAt、updatedAt 由数据库和 TypeORM 生成，创建请求只需要 name 和 email。
 *
 * 依赖条件：
 * 这些装饰器需要配合 Nest ValidationPipe 才会在 HTTP 请求上自动生效。
 */
export class CreateUserDto {
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;
}
