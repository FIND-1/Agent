/**
 * 🧱 MySQL 初始化脚本（仅用于验证结构化输出）
 *
 * ⚠️ 注意：
 * 本文件不是重点学习内容
 * 仅用于验证 LLM → structured output → DB 流程
 */

import mysql from "mysql2/promise";

async function main() {
  // 建立数据库连接（本地开发）
  const conn = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "admin",
    multipleStatements: true,
  });

  try {
    // 创建数据库（如果不存在）
    await conn.query(`CREATE DATABASE IF NOT EXISTS hello`);

    // 切换数据库
    await conn.query(`USE hello`);

    // 创建 friends 表（结构 = LLM 输出结构）
    await conn.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50),
        gender VARCHAR(10),
        birth_date DATE,
        company VARCHAR(100),
        title VARCHAR(100),
        phone VARCHAR(20),
        wechat VARCHAR(50)
      )
    `);

    console.log("✅ DB & table ready");
  } catch (err) {
    console.error("❌ DB init failed:", err);
  } finally {
    await conn.end();
  }
}

main();
