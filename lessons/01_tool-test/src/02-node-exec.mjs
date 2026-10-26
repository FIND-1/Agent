/**
 * 示例 02：execute_command 的底层 —— child_process.spawn
 *
 * 示例 03 的 execute_command 工具就是用 spawn 实现的。
 * 本示例单独把 spawn 用法拆出来，集中演示三件事：
 *   1. 平台差异：本文固定写 Windows 写法；
 *   2. shell: true 的取舍：整条命令字符串交给 shell 解析，npx 才能正常工作，因此不 split；
 *   3. 交互式命令的输入：create-vite 会询问选项，用 child.stdin.write("n\n") 模拟键盘输入。
 *
 * 依赖：无需模型 API；执行 create-vite 需要网络与 npx。
 * 注意：会在当前工作目录创建 react-todo-app；本课已存在同名应用，复习时请在临时目录运行。
 * 运行：node src/02-node-exec.mjs
 */

import { spawn } from "node:child_process";

// 整条命令字符串交给 shell，所以不再 split 成 cmd + args，
// 这一步是把 npx 这类带内部命令的命令跑起来的关键。
const command = "npx create-vite react-todo-app --template react-ts";

const child = spawn(command, {
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});

child.on("spawn", () => {
  // create-vite 会询问「是否使用 rolldown / 是否安装依赖」，用 stdin 模拟两次回车。
  setTimeout(() => {
    child.stdin.write("n\n");
    child.stdin.write("n\n");
  }, 1000);
});

let errorMsg = "";

child.on("error", (error) => {
  errorMsg = error.message;
});

child.on("close", (code) => {
  if (code === 0) {
    process.exit(0);
  } else {
    if (errorMsg) console.error(`错误: ${errorMsg}`);
    process.exit(code || 1);
  }
});
