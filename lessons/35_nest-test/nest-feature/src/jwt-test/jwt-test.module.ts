/** 复习 05：通过动态模块配置 JwtService 的签名密钥与一小时有效期；此模块与 AuthService 的模拟 Token 映射独立，不会自动替换用户守卫。 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTestController } from './jwt-test.controller';
import { JwtTestService } from './jwt-test.service';

@Module({
  imports: [
    JwtModule.register({
      // 固定密钥仅用于本课签发、校验演示，不用于实际业务认证。
      secret: 'jwt-test-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [JwtTestController],
  providers: [JwtTestService],
})
export class JwtTestModule {}
