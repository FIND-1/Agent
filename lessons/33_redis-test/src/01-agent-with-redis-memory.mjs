/**
 * 基于 Redis 的 Agent 短期记忆
 * 相比 00 的基础读写，本例新增消息序列化、会话隔离和摘要中间件。
 * 依赖 Redis 与模型 API；整体加载后写回没有同会话并发保护。
 *
 * 模式：
 * - invoke 前：从 Redis 读取该会话的 messages
 * - invoke 后：把 agent 返回的 messages 写回 Redis（带 TTL）
 * - 压缩：由 langchain summarizationMiddleware 在 agent 内部完成
 *
 * TODO：当前未配置 Redis；需先由用户准备环境，本文不代表已运行验证。
 *
 * 运行：node src/01-agent-with-redis-memory.mjs
 * 输入 exit / quit / :q 退出；:clear 清空当前会话记忆
 */
import { redisOptions } from "./_shared/redis-options.mjs";
import Redis from "ioredis";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createChatModel } from "@lessons/shared/model";
import {
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";
import { createAgent, HumanMessage, summarizationMiddleware } from "langchain";

const MEMORY_TTL = Number(process.env.MEMORY_TTL_SECONDS ?? 1800);
const KEY_PREFIX = process.env.MEMORY_KEY_PREFIX ?? "agent:short_memory";
const SESSION_ID = process.env.MEMORY_SESSION_ID ?? "demo_user_001";

const summaryPrompt = `你是对话摘要助手。请用中文总结以下对话，包含：
1. 讨论的主要话题
2. 用户提到的重要事实（姓名、偏好、日期等，务必保留原文信息）
3. 继续对话所需的关键上下文

保持简洁，不要编造，不要遗漏用户明确说过的信息。

待摘要的对话：
{messages}

摘要：`;

class RedisMessageStore {
  constructor({ redis, keyPrefix, ttlSeconds }) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.ttlSeconds = ttlSeconds;
  }

  messagesKey(sessionId) {
    return `${this.keyPrefix}:${sessionId}:messages`;
  }

  async loadMessages(sessionId) {
    const raw = await this.redis.get(this.messagesKey(sessionId));
    if (!raw) return [];
    return mapStoredMessagesToChatMessages(JSON.parse(raw));
  }

  async saveMessages(sessionId, messages) {
    const payload = JSON.stringify(mapChatMessagesToStoredMessages(messages));
    await this.redis.set(
      this.messagesKey(sessionId),
      payload,
      "EX",
      this.ttlSeconds,
    );
  }

  async clear(sessionId) {
    await this.redis.del(this.messagesKey(sessionId));
  }

  async ttl(sessionId) {
    return this.redis.ttl(this.messagesKey(sessionId));
  }
}

async function invokeWithMemory(agent, store, sessionId, userText) {
  const history = await store.loadMessages(sessionId);
  console.log(`  ↳ 从 Redis 加载 ${history.length} 条历史`);

  const result = await agent.invoke(
    { messages: [...history, new HumanMessage(userText)] },
    { recursionLimit: 30 },
  );

  await store.saveMessages(sessionId, result.messages);
  const ttl = await store.ttl(sessionId);
  console.log(`  ↳ 写回 Redis ${result.messages.length} 条 (TTL ${ttl}s)`);

  return result;
}

const redis = new Redis(redisOptions());

redis.on("connect", () => console.log("✅ Redis 已连接"));
redis.on("error", (err) => console.error("❌ Redis 错误:", err.message));

const store = new RedisMessageStore({
  redis,
  keyPrefix: KEY_PREFIX,
  ttlSeconds: MEMORY_TTL,
});

const model = createChatModel({}, 0);

const agent = createAgent({
  model,
  tools: [],
  systemPrompt:
    "你是会话助手。记住用户提到的关键事实，中文简短回答。若消息中有对话摘要，请据此继续对话。",
  middleware: [
    summarizationMiddleware({
      model,
      summaryPrompt,
      trigger: { messages: 8 },
      keep: { messages: 4 },
    }),
  ],
});

console.log("输入 exit / quit / :q 退出，:clear 清空记忆\n");

const rl = readline.createInterface({ input: stdin, output: stdout });
let prevCount = 0;

try {
  await redis.connect();
  prevCount = (await store.loadMessages(SESSION_ID)).length;
  while (true) {
    const userText = (await rl.question("你: ")).trim();
    if (!userText) continue;

    if (["exit", "quit", ":q"].includes(userText.toLowerCase())) break;

    if (userText === ":clear") {
      await store.clear(SESSION_ID);
      prevCount = 0;
      console.log("已清空当前会话记忆\n");
      continue;
    }

    const { messages } = await invokeWithMemory(
      agent,
      store,
      SESSION_ID,
      userText,
    );
    console.log("\n助手:", messages.at(-1)?.content);
    console.log(`当前消息数: ${messages.length}`);
    if (messages.length < prevCount + 2) {
      console.log("  消息数量减少，可能发生了摘要压缩（以中间件行为为准）");
    }
    prevCount = messages.length;
    console.log();
  }
} catch (err) {
  console.error("执行异常：", err.message);
  process.exitCode = 1;
} finally {
  rl.close();
  redis.disconnect();
}
