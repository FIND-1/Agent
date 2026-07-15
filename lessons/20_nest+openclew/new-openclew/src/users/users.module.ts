import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * 复习重点：
 * UsersModule 把用户相关 Controller 和 Service 绑定成一个功能模块。
 *
 * 原文分析结论：
 * 导出 UsersService 后，ToolModule 才能注入它并封装 db_users_crud tool。
 *
 * 依赖条件：
 * 当前 UsersService 直接注入全局 EntityManager，所以本模块没有额外注册 TypeOrmModule.forFeature。
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
