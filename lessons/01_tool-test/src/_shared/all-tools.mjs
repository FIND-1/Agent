import { tool } from "@langchain/core/tools";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";

// 1. 读取文件工具
const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      console.log(
        `  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`,
      );
      return `文件内容:\n${content}`;
    } catch (error) {
      console.log(
        `  [工具调用] read_file("${filePath}") - 错误: ${error.message}`,
      );
      return `读取文件失败: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "读取指定路径的文件内容",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
    }),
  },
);

// 2. 写入文件工具
const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      console.log(
        `  [工具调用] write_file("${filePath}") - 成功写入 ${content.length} 字节`,
      );
      return `文件写入成功: ${filePath}`;
    } catch (error) {
      console.log(
        `  [工具调用] write_file("${filePath}") - 错误: ${error.message}`,
      );
      return `写入文件失败: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: "向指定路径写入文件内容，自动创建目录",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
      content: z.string().describe("要写入的文件内容"),
    }),
  },
);

// 3. 执行命令工具（带实时输出）
// import { spawn } from "child_process";

const executeCommandTool = tool(
  async ({ command, workingDirectory, timeout = 20000, detached = false }) => {
    const cwd = workingDirectory || process.cwd();

    console.log(
      `[工具调用] execute_command("${command}") ${
        workingDirectory ? `- cwd: ${workingDirectory}` : ""
      } ${detached ? "[detached]" : ""}`,
    );

    // 👉 拆分命令（注意 Windows 兼容）
    const child = spawn(command, {
      cwd,
      shell: true,
      detached,
      stdio: detached ? "ignore" : "pipe", // ⚠️ detached 必须 ignore
    });

    // 👉 非阻塞模式（启动服务用）
    if (detached) {
      child.unref(); // 🔥 关键：让主进程不等待
      return `命令已启动（detached）: ${command}`;
    }

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let finished = false;

      // 👉 收集输出（可选实时打印）
      child.stdout?.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text); // 实时输出
      });

      child.stderr?.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      // 👉 timeout 控制
      const timer = setTimeout(() => {
        if (!finished) {
          console.log(`\n⚠️ 命令超时，强制终止: ${command}`);
          child.kill("SIGTERM");
          finished = true;
          resolve(`命令执行超时（已终止）: ${command}`);
        }
      }, timeout);

      child.on("close", (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        if (code === 0) {
          console.log(`\n[执行成功] ${command}`);
          resolve(`执行成功: ${command}`);
        } else {
          console.log(`\n[执行失败] ${command} (code ${code})`);
          resolve(`执行失败: ${command}\n${stderr}`);
        }
      });

      child.on("error", (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(`执行错误: ${err.message}`);
      });
    });
  },
  {
    name: "execute_command",
    description: "执行系统命令，支持 timeout 和 detached 模式",
    schema: z.object({
      command: z.string(),
      workingDirectory: z.string().optional(),
      timeout: z.number().optional().describe("超时时间(ms)，默认20秒"),
      detached: z.boolean().optional().describe("是否后台执行（适用于启动服务）"),
    }),
  },
);

// 4. 列出目录内容工具
const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    try {
      const files = await fs.readdir(directoryPath);
      console.log(
        ` [工具调用] list_directory("${directoryPath}") - 找到${files.length}个项目`,
      );
      return `目录内容:\n${files.map((f) => `- ${f}`).join("\n")}`;
    } catch (error) {
      console.log(
        `  [工具调用] list_directory("${directoryPath}") - 错误: ${error.message}`,
      );
      return `列出目录失败: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "列出指定目录下的所有文件和文件夹",
    schema: z.object({
      directoryPath: z.string().describe("目录路径"),
    }),
  },
);

export { readFileTool, writeFileTool, executeCommandTool, listDirectoryTool };
