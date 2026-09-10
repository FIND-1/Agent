/** 复习 01：Controller 负责 HTTP 路由，构造器注入 AppService；不需要手动 new。返回值还会经过全局拦截器，直接调用方法的单测则不会。 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
