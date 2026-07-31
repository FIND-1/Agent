import tencentcloud from "tencentcloud-sdk-nodejs-asr";
import fs from "node:fs/promises";
import { requireEnv } from "./_shared/env.mjs";

/**
 * 第三步：读取一段已经录完的 MP3，通过一句话识别接口转成文本。
 * 这对应常见的“说完再识别”交互，不演示实时 ASR。
 */
const AsrClient = tencentcloud.asr.v20190614.Client;
const audioPath = new URL("../output.mp3", import.meta.url);
const client = new AsrClient({
  credential: {
    secretId: requireEnv("SECRET_ID"),
    secretKey: requireEnv("SECRET_KEY"),
  },
  region: "ap-shanghai",
  profile: {
    httpProfile: {
      reqMethod: "POST",
      reqTimeout: 30,
    },
  },
});

const audioBuffer = await fs.readFile(audioPath);
const result = await client.SentenceRecognition({
  EngSerViceType: "16k_zh",
  SourceType: 1,
  Data: audioBuffer.toString("base64"),
  DataLen: audioBuffer.length,
  VoiceFormat: "mp3",
});

console.log("识别结果：", result.Result);
