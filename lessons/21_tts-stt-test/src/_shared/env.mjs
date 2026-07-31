import "@lessons/shared/env-loader";

/**
 * Lesson 21 的脚本统一从项目根目录 .env 读取配置。
 * 集中校验可以避免每个示例重复读取变量，也能在请求外部服务前给出明确错误。
 */
export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`请先在项目根目录 .env 配置 ${name}`);
  }
  return value;
}

export function getTtsVoiceType() {
  const value = Number(process.env.TTS_VOICE_TYPE ?? 502006);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("根目录 .env 中的 TTS_VOICE_TYPE 必须是正整数");
  }
  return value;
}
