/** 复习 01：Injectable 配合模块 providers 参与依赖注入；当前仅返回固定文本，是理解 DI 的最小起点。 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
