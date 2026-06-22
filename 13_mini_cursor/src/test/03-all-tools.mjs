/**
 * mini cursor 的最小工具集。
 *
 * 这些工具不是本文重点，重点是 mini-cursor.mjs 里如何流式观察
 * tool call 参数。这里保持工具实现简单、直接，方便复习主线。
 */

import { tool } from "@langchain/core/tools";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      console.log(`[工具调用] read_file("${filePath}") - 读取 ${content.length} 字符`);
      return `文件内容:\n${content}`;
    } catch (error) {
      return `读取文件失败: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "读取指定路径的文件内容",
    schema: z.object({
      filePath: z.string().describe("文件路径，可以是相对路径或绝对路径"),
    }),
  },
);

const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      console.log(`[工具调用] write_file("${filePath}") - 写入 ${content.length} 字符`);
      return `文件写入成功: ${filePath}`;
    } catch (error) {
      return `写入文件失败: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: "向指定路径写入文件内容，目录不存在时自动创建",
    schema: z.object({
      filePath: z.string().describe("文件路径，可以是相对路径或绝对路径"),
      content: z.string().describe("要写入文件的完整内容"),
    }),
  },
);

const executeCommandTool = tool(
  async ({ command, workingDirectory, timeout = 20000, detached = false }) => {
    const cwd = workingDirectory || process.cwd();

    console.log(
      `[工具调用] execute_command("${command}")${workingDirectory ? ` - cwd: ${workingDirectory}` : ""}`,
    );

    const child = spawn(command, {
      cwd,
      shell: true,
      detached,
      stdio: detached ? "ignore" : "pipe",
    });

    if (detached) {
      child.unref();
      return `命令已在后台启动: ${command}`;
    }

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let finished = false;

      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        child.kill("SIGTERM");
        resolve(`命令执行超时，已终止: ${command}`);
      }, timeout);

      child.stdout?.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });

      child.stderr?.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      child.on("close", (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        if (code === 0) {
          resolve(`执行成功: ${command}\n${stdout}`.trim());
        } else {
          resolve(`执行失败: ${command}\n${stderr || stdout}`.trim());
        }
      });

      child.on("error", (error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(`执行错误: ${error.message}`);
      });
    });
  },
  {
    name: "execute_command",
    description: "执行系统命令，支持 workingDirectory、timeout、detached",
    schema: z.object({
      command: z.string().describe("要执行的命令"),
      workingDirectory: z.string().optional().describe("命令执行目录"),
      timeout: z.number().optional().describe("超时时间，单位 ms，默认 20000"),
      detached: z.boolean().optional().describe("是否后台运行，适合启动 dev server"),
    }),
  },
);

const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      const lines = entries.map((entry) => `${entry.isDirectory() ? "[dir]" : "[file]"} ${entry.name}`);
      console.log(`[工具调用] list_directory("${directoryPath}") - ${entries.length} 项`);
      return `目录内容:\n${lines.join("\n")}`;
    } catch (error) {
      return `列出目录失败: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "列出指定目录下的文件和文件夹",
    schema: z.object({
      directoryPath: z.string().describe("目录路径"),
    }),
  },
);

export { executeCommandTool, listDirectoryTool, readFileTool, writeFileTool };
