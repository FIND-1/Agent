import "@lessons/shared/env-loader";

// 两个示例共用连接配置；这里只生成选项，不创建客户端或连接 Redis。
// 依赖根 .env / 进程环境变量，当前 Redis 环境仍待接入。
export function redisOptions() {
  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    db: Number(process.env.REDIS_DB ?? 0),
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy: () => null,
  };
}
