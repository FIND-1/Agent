/** 复习 04：ApiResponse 是响应契约，JwtPayload 是模拟用户形状；接口仅用于编译检查，不会校验请求 JSON，也不同于 jwt-test 的 sub 载荷。 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface JwtPayload {
  id: number;
  username: string;
  role: 'admin' | 'user';
}
