/** 复习 05：注入 JwtService 完成签名和签名/有效期校验；verify 不只是解码。泛型不验证 payload 的业务字段，也不会检查用户是否被禁用。 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtTestPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtTestService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: JwtTestPayload): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string): JwtTestPayload {
    try {
      return this.jwtService.verify<JwtTestPayload>(token);
    } catch {
      throw new UnauthorizedException('Token 无效或已过期');
    }
  }
}
