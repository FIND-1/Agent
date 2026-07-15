import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 复习重点：
 * User 是 TypeORM entity，用一个 class 描述 users 表结构。
 *
 * 原文分析结论：
 * ORM 把对对象的 save/find/update/delete 转换成 SQL，后续 db_users_crud tool 才能通过 UsersService 操作真实数据。
 *
 * 依赖条件：
 * AppModule 的 TypeOrmModule.entities 必须包含 User，且示例中依赖 synchronize=true 自动建表。
 */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
  })
  name: string;

  @Column({
    length: 50,
  })
  email: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;
}
