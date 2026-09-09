import "@lessons/shared/env-loader";
import { MemoryClient } from "mem0ai";

// 供 lessons 示例复用的 Mem0 云端初始化；创建客户端不代表服务已连接或记忆已写入。
export function createMem0Client() {
  if (!process.env.MEM0_API_KEY)
    throw new Error("缺少 MEM0_API_KEY，请配置仓库根 .env");
  return new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
}
