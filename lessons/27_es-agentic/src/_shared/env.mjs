import { config } from "dotenv";

// 所有示例统一读取项目根目录 .env，避免从不同工作目录运行时拿不到课程配置。
config({ path: new URL("../../../../.env", import.meta.url), quiet: true });

const envNames = {
  apiKey: "ESAGENT_API_KEY",
  baseUrl: "ESAGENT_BASE_URL",
  rerankUrl: "ESAGENT_RERANK_URL",
  modelName: "ESAGENT_MODEL_NAME",
  rerankModel: "ESAGENT_RERANK_MODEL",
};

export function readEsAgentEnv(required = []) {
  const values = Object.fromEntries(
    Object.entries(envNames).map(([key, envName]) => [
      key,
      process.env[envName],
    ]),
  );
  const missing = required
    .filter((key) => !values[key])
    .map((key) => envNames[key] ?? key);

  if (missing.length > 0) {
    throw new Error(`根目录 .env 缺少配置：${missing.join(", ")}`);
  }

  return values;
}
