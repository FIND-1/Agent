// TODO：当前无 Redis 环境；此脚本仅在准备好独立练习实例后手动运行。
// 文章的基础示例：通过 ioredis 对照命令手册理解各类型；下一节再将其用于会话记忆。
// 此处仅演示读写，重复运行可能累积数据，锁也不包含完整的安全释放协议。
import { redisOptions } from "./_shared/redis-options.mjs";
import Redis from "ioredis";

// 创建 Redis 客户端
const redis = new Redis({
  ...redisOptions(),
  keyPrefix: "lesson33:demo:",
});

// 监听连接
redis.on("connect", () => {
  console.log("✅ ioredis 连接成功（mjs 版）");
});

// 错误监听
redis.on("error", (err) => {
  console.error("❌ Redis 连接失败：", err);
});

// 执行操作
async function runRedisDemo() {
  try {
    await redis.connect();
    // =========================
    // 1. String 字符串
    // =========================
    await redis.set("name", "张三");
    await redis.set("code", "6666", "EX", 300); // 5 分钟过期
    console.log("String name:", await redis.get("name"));

    // =========================
    // 2. Hash 哈希
    // =========================
    await redis.hset("user:1001", "name", "李四", "age", 28);
    console.log("Hash user:", await redis.hgetall("user:1001"));

    // =========================
    // 3. List 列表
    // =========================
    await redis.lpush("task:list", "任务1", "任务2");
    await redis.rpush("task:list", "任务3");
    console.log("List:", await redis.lrange("task:list", 0, -1));

    // =========================
    // 4. Set 集合
    // =========================
    await redis.sadd("tag:set", "redis", "nest", "node");
    console.log("Set:", await redis.smembers("tag:set"));

    // =========================
    // 5. ZSet 有序集合
    // =========================
    await redis.zadd("score:rank", 99, "小明", 95, "小红");
    console.log("ZSet 排名:", await redis.zrange("score:rank", 0, -1));

    // =========================
    // 6. SET NX EX 加锁原语（不是完整的生产分布式锁）
    // =========================
    const lockKey = "lock:order:1001";
    const lockResult = await redis.set(lockKey, "locked", "NX", "EX", 10);
    console.log("分布式锁:", lockResult ? "加锁成功" : "加锁失败");
  } catch (err) {
    console.error("执行异常：", err);
    process.exitCode = 1;
  } finally {
    redis.disconnect();
  }
}

// 运行
await runRedisDemo();
