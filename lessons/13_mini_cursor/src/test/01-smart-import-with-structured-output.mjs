/**
 * 🤖 智能录入核心实现
 *
 * 流程：
 * 1. 文本输入
 * 2. LLM structured extraction
 * 3. schema validation
 * 4. 数据落库（MySQL）
 *
 * ⚠️ TODO：
 * 当前实现耦合 MySQL，后续可替换为：
 * - JSON store（推荐）
 * - SQLite
 * - API ingestion
 */

import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import mysql from 'mysql2/promise';

// ----------------------
// LLM 初始化
// ----------------------
const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// ----------------------
// Schema 定义（核心）
// ----------------------
const friendSchema = z.object({
  name: z.string().describe('姓名'),
  gender: z.string().describe('性别'),
  birth_date: z.string().describe('YYYY-MM-DD'),
  company: z.string().nullable(),
  title: z.string().nullable(),
  phone: z.string().nullable(),
  wechat: z.string().nullable(),
});

// 多人结构
const structuredModel = model.withStructuredOutput(z.array(friendSchema));

/**
 * 提取 + 写入数据库
 */
export async function extractAndInsert(text) {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'hello'
  });

  try {
    // ----------------------
    // Step 1: LLM 提取
    // ----------------------
    const result = await structuredModel.invoke(
      `请提取好友信息：${text}`
    );

    console.log("📦 structured result:", result);

    if (!result?.length) {
      console.log("⚠️ no data extracted");
      return;
    }

    // ----------------------
    // Step 2: 数据转换
    // ----------------------
    const values = result.map(i => [
      i.name,
      i.gender,
      i.birth_date,
      i.company,
      i.title,
      i.phone,
      i.wechat
    ]);

    // ----------------------
    // Step 3: 批量写入
    // ----------------------
    await conn.query(
      `INSERT INTO friends (name,gender,birth_date,company,title,phone,wechat) VALUES ?`,
      [values]
    );

    console.log(`✅ inserted ${values.length} rows`);

    return result;

  } catch (err) {
    console.error("❌ error:", err);
    throw err;
  } finally {
    await conn.end();
  }
}
