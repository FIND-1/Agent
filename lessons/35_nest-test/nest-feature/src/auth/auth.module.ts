/** 复习 02：Global + exports 让已导入本模块的应用共享 AuthService；隔离测试仍需导入该模块，Global 不会跨测试容器生效。 */
import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';

@Global()
@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
