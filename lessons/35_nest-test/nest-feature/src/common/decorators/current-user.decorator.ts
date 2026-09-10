/** 复习 03：参数装饰器读取 Guard 写入的 request.user，不自行认证；应与认证守卫搭配，不能凭返回类型保证运行时一定存在用户。 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/api-response.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
