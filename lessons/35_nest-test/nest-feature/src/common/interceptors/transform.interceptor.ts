/** 复习 04：next.handle() 包裹后续 Pipe/Handler，RxJS map 转换成功响应，tap 记录成功耗时；异常交给 Filter。body.code 固定 200 不会把 POST 的 HTTP 201 改为 200。 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
    }>();
    const { method, url } = request;
    const startTime = Date.now();
    const requestTime = new Date().toISOString();

    console.log(`[请求] ${requestTime} ${method} ${url}`);

    return next.handle().pipe(
      map((data) => ({
        code: 200,
        data,
        message: '成功',
      })),
      tap(() => {
        const duration = Date.now() - startTime;
        console.log(
          `[响应] ${new Date().toISOString()} ${method} ${url} 耗时 ${duration}ms`,
        );
      }),
    );
  }
}
