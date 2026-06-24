import { spawn } from "node:child_process";
//! 注意： node 版本要在20以上

// 修改前适合Linux/Unix 
// const command = "ls -la";

// 修改后适合window
// const command = "dir";
// echo 两个 n 是有时候 vite 会让你选择两个选项：
// 用不用 rolldown、安不安装依赖echo n 然后通过管道操作符输出给那个进程就和键盘输入 n 一样的效果。
// const command = 'echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts';


// const cwd = process.cwd();

// 检测平台
// const isWindows = process.platform === "win32";
// const command = isWindows ? "dir" : "ls -la";

//  解析命令和参数
// const [cmd, ...args] = command.split(" ");

// const child = spawn(cmd, args, {
//   cwd,
//   stdio: "inherit", // 实时输出到控制台
//   shell: true, // 开启 shell 模式有助于在 Windows 上识别内部命令
// });

// let errorMsg = "";

// child.on("error", (error) => {
//   errorMsg = error.message;
// });

// child.on("close", (code) => {
//   if (code === 0) {
//     process.exit(0);
//   } else {
//     if (errorMsg) {
//       console.error(`错误: ${errorMsg}`);
//     }
//     process.exit(code || 1);
//   }
// });


// 适合 window 的写法
// import { spawn } from "node:child_process";

// 使用 npx 代替 pnpm，避免环境找不到 pnpm 的问题
// 注意：这里直接拼成字符串，配合 shell: true 使用
const command = "npx create-vite react-todo-app --template react-ts";

// 因为我们要用 shell 来解析字符串，所以不需要 split
const child = spawn(command, {
  stdio: ["pipe", "inherit", "inherit"],
  shell: true, // 必须为 true 才能让 npx 正常工作
});

child.on("spawn", () => {
  setTimeout(() => {
    child.stdin.write("n\n");
    child.stdin.write("n\n");
  }, 1000); // Vite 启动可能需要一点时间，稍微延长一点延迟更稳妥
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