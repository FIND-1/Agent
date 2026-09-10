/** 复习 02：模块聚合 Controller、Service 和 Guard；Guard 依赖由全局 AuthModule 导出的 AuthService，各职责通过 DI 连接。 */
import { Module } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthGuard],
})
export class UserModule {}
