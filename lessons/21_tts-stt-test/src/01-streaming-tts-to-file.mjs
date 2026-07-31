import WebSocket from "ws";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import { getTtsVoiceType, requireEnv } from "./_shared/env.mjs";

/**
 * 第二步：通过腾讯云 WebSocket 分段发送文本，并把返回的二进制音频持续写入文件。
 * 这个示例展示“边输入文本、边接收音频”，但这里只落盘，不负责浏览器实时播放。
 */
const SECRET_ID = requireEnv("SECRET_ID");
const SECRET_KEY = requireEnv("SECRET_KEY");
const APP_ID = Number(requireEnv("APP_ID"));
const VOICE_TYPE = getTtsVoiceType();
const OUTPUT_FILE = new URL("../output-stream.mp3", import.meta.url);
const TEXT_INTERVAL_MS = 300;
const TEXTS = [
  "傍晚我还在为晚霞开心，",
  "突然接到电话说系统崩了，",
  "我心里一沉冲回办公室，",
  "好在大家一起排查后终于恢复，",
  "我长长松了口气。",
];

if (!Number.isInteger(APP_ID) || APP_ID <= 0) {
  throw new Error("根目录 .env 中的 APP_ID 必须是正整数");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildWsUrl() {
  const now = Math.floor(Date.now() / 1000);
  const sessionId = randomUUID();
  const params = {
    Action: "TextToStreamAudioWSv2",
    AppId: APP_ID,
    Codec: "mp3",
    Expired: now + 3600,
    SampleRate: 16000,
    SecretId: SECRET_ID,
    SessionId: sessionId,
    Speed: 0,
    Timestamp: now,
    VoiceType: VOICE_TYPE,
    Volume: 5,
  };
  const signStr = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const rawStr = `GETtts.cloud.tencent.com/stream_wsv2?${signStr}`;
  const signature = createHmac("sha1", SECRET_KEY)
    .update(rawStr)
    .digest("base64");
  const searchParams = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
    Signature: signature,
  });

  return {
    sessionId,
    url: `wss://tts.cloud.tencent.com/stream_wsv2?${searchParams}`,
  };
}

async function sendTexts(ws, sessionId) {
  for (const [index, text] of TEXTS.entries()) {
    ws.send(
      JSON.stringify({
        session_id: sessionId,
        message_id: `msg_${index}`,
        action: "ACTION_SYNTHESIS",
        data: text,
      }),
    );
    console.log(`[文本] 已发送：${text}`);
    if (index < TEXTS.length - 1) {
      await sleep(TEXT_INTERVAL_MS);
    }
  }
  ws.send(
    JSON.stringify({
      session_id: sessionId,
      action: "ACTION_COMPLETE",
    }),
  );
}

const { url, sessionId } = buildWsUrl();
const ws = new WebSocket(url);
const writeStream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });
let totalBytes = 0;
let finished = false;

function finish() {
  if (finished) return;
  finished = true;
  writeStream.end(() => {
    console.log(
      `[保存] 音频已保存至 ${OUTPUT_FILE.pathname}，共 ${totalBytes} 字节`,
    );
  });
  if (ws.readyState < WebSocket.CLOSING) {
    ws.close();
  }
}

ws.on("open", () => {
  console.log("[连接] WebSocket 已建立，等待服务端就绪");
});

ws.on("message", async (data, isBinary) => {
  if (isBinary) {
    writeStream.write(data);
    totalBytes += data.length;
    return;
  }

  const message = JSON.parse(data.toString());
  if (message.ready === 1) {
    await sendTexts(ws, sessionId);
  } else if (message.code && message.code !== 0) {
    console.error(`[错误] code=${message.code}, message=${message.message}`);
    finish();
  } else if (message.final === 1) {
    finish();
  }
});

ws.on("error", (error) => {
  console.error("[WebSocket 错误]", error.message);
  finish();
});

ws.on("close", finish);
