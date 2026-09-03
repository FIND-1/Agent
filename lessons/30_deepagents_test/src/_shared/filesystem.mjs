import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 集中处理示例工作区的宿主文件操作，让核心示例只关注 DeepAgents middleware。
export function resolveFromModule(metaUrl, ...segments) {
  return path.join(path.dirname(fileURLToPath(metaUrl)), ...segments);
}

export function resolvePath(...segments) {
  return path.join(...segments);
}

export function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

export function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

export function resetDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  ensureDirectory(directory);
}

export function writeTextFile(rootDir, relativePath, content) {
  fs.writeFileSync(path.join(rootDir, relativePath), content, "utf8");
}

export function readTextFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

export function listFiles(directory) {
  if (!pathExists(directory)) return [];
  return fs.readdirSync(directory);
}
