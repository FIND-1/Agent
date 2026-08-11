import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { Book } from './book/entities/book.entity';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * 根模块把文章的三条链路接到一起：静态页面、Book 业务模块、MySQL 持久化。
 * 相比纯 Nest CRUD，这里新增了运行环境感知：宿主机开发连接 localhost，Compose 生产环境连接服务名 mysql-prod。
 * 数据库与 Docker 都是外部前置条件；synchronize 和明文凭据仅用于课程演示，不能照搬到生产环境。
 */
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      serveRoot: '/books',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: isProduction ? 'mysql-prod' : 'localhost',
      port: 3306,
      username: 'root',
      password: 'admin',
      database: 'book',
      synchronize: true,
      logging: true,
      autoLoadEntities: true,
      entities: [Book],
    }),
    BookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
