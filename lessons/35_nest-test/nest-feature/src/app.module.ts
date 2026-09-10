import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtTestModule } from './jwt-test/jwt-test.module';
import { UserModule } from './user/user.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// 复习入口：imports 组织模块，providers 交给 DI 容器创建；仅定义 AOP 类不会自动生效。
// 使用 APP_* 注册全局响应切面；Guard 仍只作用于显式标注的用户路由。

@Module({
  imports: [AuthModule, UserModule, JwtTestModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
