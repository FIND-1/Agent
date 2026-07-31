import tencentcloud from "tencentcloud-sdk-nodejs-tts";
import fs from "node:fs/promises";
import { getTtsVoiceType, requireEnv } from "./_shared/env.mjs";

/**
 * 学习起点：一次提交完整文本，拿到 Base64 音频后写成 MP3。
 * 它适合短文本和基础 API 验证，但必须等待整段音频生成，不适合朗读流式回答。
 */
const TtsClient = tencentcloud.tts.v20190823.Client;
const client = new TtsClient({
  credential: {
    secretId: requireEnv("SECRET_ID"),
    secretKey: requireEnv("SECRET_KEY"),
  },
  region: "ap-beijing",
  profile: {
    httpProfile: {
      endpoint: "tts.tencentcloudapi.com",
    },
  },
});

const outputPath = new URL("../output.mp3", import.meta.url);
const data = await client.TextToVoice({
  Text: "下班路上，我还在为晚霞开心。突然电话响起：系统崩了。大家一起排查、重启，屏幕终于恢复正常。",
  SessionId: `lesson21_${Date.now()}`,
  VoiceType: getTtsVoiceType(),
  Codec: "mp3",
});

await fs.writeFile(outputPath, Buffer.from(data.Audio, "base64"));
console.log("MP3 已保存至：", outputPath.pathname);
