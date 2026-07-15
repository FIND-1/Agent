import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AiModule } from './ai/ai.module';
import { JobModule } from './job/job.module';
import { Job } from './job/entities/job.entity';

/**
 * 复习重点：
 * AppModule 是整节课的装配中心：环境变量、邮件、数据库、定时任务和业务模块都在这里接入。
 *
 * 原文分析结论：
 * Agent 能力不是只靠模型完成，而是由 Nest 模块把外部能力注册为可注入服务，再交给 tool 暴露给模型。
 *
 * 依赖条件：
 * 当前项目没有提供 Docker/MySQL/SQL 环境；MySQL 连接只能视为课程 TODO，不能宣称已完成运行验证。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '..', '..', '..', '.env'),
    }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailUser = configService.get<string>('MAIL_USER');

        return {
          transport: {
            host: configService.get<string>('MAIL_HOST') ?? 'localhost',
            port: Number(configService.get<string>('MAIL_PORT') ?? 587),
            secure: configService.get<string>('MAIL_SECURE') === 'true',
            auth: mailUser
              ? {
                  user: mailUser,
                  pass: configService.get<string>('MAIL_PASS') ?? '',
                }
              : undefined,
          },
          defaults: {
            from:
              configService.get<string>('MAIL_FROM') ?? 'no-reply@example.com',
          },
        };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'openclew',
      synchronize: true,
      entities: [User, Job],
    }),
    UsersModule,
    AiModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
