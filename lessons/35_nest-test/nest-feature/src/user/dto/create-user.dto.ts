/** 复习 02：DTO 表达请求体的 TypeScript 形状；当前没有校验装饰器或 ValidationPipe，HTTP 输入不会因此自动校验。 */
export class CreateUserDto {
  username!: string;
  name!: string;
  age!: number;
}
