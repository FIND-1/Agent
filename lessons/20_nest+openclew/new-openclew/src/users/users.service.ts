import { Inject, Injectable } from '@nestjs/common';
import { DeleteResult, EntityManager, UpdateResult } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

/**
 * 复习重点：
 * UsersService 是用户表 CRUD 的真实执行层，HTTP Controller 和 db_users_crud tool 都应该复用它。
 *
 * 原文分析结论：
 * Agent tool 不应直接拼 SQL；它只选择动作和参数，具体数据库操作仍交给可测试的业务服务。
 *
 * 依赖条件：
 * 当前项目没有可用 MySQL 环境；这里的 EntityManager CRUD 只能作为教学结构和 TODO，暂不做端到端验证。
 */
@Injectable()
export class UsersService {
  @Inject(EntityManager)
  entityManager: EntityManager;

  create(createUserDto: CreateUserDto): Promise<User> {
    return this.entityManager.save(User, createUserDto);
  }

  findAll(): Promise<User[]> {
    return this.entityManager.find(User);
  }

  findOne(id: number): Promise<User | null> {
    return this.entityManager.findOne(User, { where: { id } });
  }

  update(id: number, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return this.entityManager.update(User, id, updateUserDto);
  }

  remove(id: number): Promise<DeleteResult> {
    return this.entityManager.delete(User, id);
  }
}
