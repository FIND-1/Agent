/** 复习 02：先用内存 Token 映射理解认证，再看 jwt-test 的签名验证。这里的 JwtPayload 名称沿用原代码，实际不是 JWT 解码结果；无数据库依赖。 */
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../common/interfaces/api-response.interface';

@Injectable()
export class AuthService {
  /** 模拟 Token 与用户映射，实际项目应使用 JWT + 数据库 */
  private readonly tokenMap: Record<string, JwtPayload> = {
    'admin-token-123': { id: 1, username: 'admin', role: 'admin' },
    'user-token-456': { id: 2, username: 'zhangsan', role: 'user' },
  };

  validateToken(token: string): JwtPayload | null {
    return this.tokenMap[token] ?? null;
  }
}
