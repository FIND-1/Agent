/** 创建接口的数据形状；本课聚焦 Docker/TypeORM，尚未引入 class-validator 做运行时校验。 */
export class CreateBookDto {
  title!: string;
  author!: string;
  description!: string;
  price!: number;
  stock!: number;
  publishedAt!: string;
}
