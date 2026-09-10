/** 复习 02：这里只是内存用户的数据形状，并非 TypeORM 实体，不会建表或持久化。 */
export class User {
  id!: number;
  username!: string;
  name!: string;
  age!: number;
  role!: 'admin' | 'user';
}
