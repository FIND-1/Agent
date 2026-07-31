# Lesson 21：给 Agent 加上语音交互

## 学习目标

这节课不是只调用一次语音 API，而是按文章顺序完成一条可复述的语音 Agent 链路：

1. 普通 TTS：完整文本一次性合成为 MP3。
2. 流式 TTS：通过 WebSocket 分段发送文本并持续接收音频。
3. ASR：把录制完成的音频识别为文字。
4. 语音 Agent：浏览器录音后调用 ASR，再用 SSE 返回模型文本，同时用另一条 WebSocket 返回流式语音。

关键设计是把两种数据分开：SSE 适合流式文本；音频是二进制数据，用 WebSocket 传输可避免 Base64 带来的额外体积。

## 推荐复习顺序

| 顺序 | 文件 | 学习目的 | 外部依赖 |
| --- | --- | --- | --- |
| 1 | `src/00-tts-to-file.mjs` | 理解 TTS 请求、Base64 解码与 MP3 落盘 | 腾讯云 TTS |
| 2 | `src/01-streaming-tts-to-file.mjs` | 理解 WebSocket 签名、文本分片和二进制音频流 | 腾讯云流式 TTS |
| 3 | `src/02-asr-from-file.mjs` | 理解音频 Base64 编码与一句话识别 | 腾讯云 ASR |
| 4 | `public/asr.html` | 理解 MediaRecorder、Blob、FormData 上传 | 浏览器麦克风、Nest 服务 |
| 5 | `asr-and-tts-nest-service/src/speech/` | 理解 ASR 接口与 TTS relay | 腾讯云语音服务 |
| 6 | `asr-and-tts-nest-service/src/ai/` | 理解 LangChain 流式输出和 Nest SSE | 模型 API |
| 7 | `public/ai-assistant.html` | 串起 ASR、SSE、WebSocket、MediaSource | 上述全部服务 |

## 根目录配置

所有脚本和 Nest 服务都读取项目根目录 `D:\1project\agent\.env`，子课程不维护自己的 `.env`。

```dotenv
SECRET_ID=腾讯云 SecretId
SECRET_KEY=腾讯云 SecretKey
APP_ID=腾讯云账号 AppId
TTS_VOICE_TYPE=502006
OPENAI_API_KEY=模型服务密钥
OPENAI_BASE_URL=OpenAI 兼容接口地址
MODEL_NAME=模型名称
```

`TTS_VOICE_TYPE` 同时作用于普通 TTS、独立流式 TTS 和 Nest TTS relay。修改后需要重启正在运行的 Nest 服务。

## 运行方式

请在项目根目录 `D:\1project\agent` 执行。依赖统一由根 `package.json` 和根 `node_modules` 管理。

### 1. 语法和编译检查

```powershell
npm --prefix lessons/21_tts-stt-test run check
npm --prefix lessons/21_tts-stt-test run server:build
```

这些检查不会请求模型或腾讯云 API。

### 2. 需要腾讯云 API

```powershell
npm --prefix lessons/21_tts-stt-test run tts
npm --prefix lessons/21_tts-stt-test run tts:stream
npm --prefix lessons/21_tts-stt-test run asr
```

先运行 `tts` 生成 `output.mp3`，再运行 `asr`，可以复习最短的“文本 → 音频 → 文本”闭环。

### 3. 需要模型 API 和腾讯云 API

```powershell
npm --prefix lessons/21_tts-stt-test run server:start
```

启动后访问：

- `http://localhost:3000/asr.html`：只验证录音上传和 ASR。
- `http://localhost:3000/ai-assistant.html`：验证完整语音 Agent。

完整页面的调用链：

```text
MediaRecorder
  -> POST /speech/asr
  -> GET /ai/chat/stream（SSE 文本）
  -> ai.tts.stream（Nest 事件）
  -> /tts（WebSocket 二进制音频）
  -> Audio + MediaSource + SourceBuffer
```

## fallback 复习路径

- 没有腾讯云凭证：执行语法检查和 Nest 编译，阅读三个编号脚本；打开页面源码观察 MediaRecorder、SSE 和 WebSocket 的职责边界。
- 没有模型 API：运行前三个独立脚本，或只验证 `/speech/asr` 与 `asr.html`。
- 浏览器不支持 MP3 MediaSource：页面会缓存 WebSocket 音频片段，在收到 `tts_final` 后合并为 Blob 播放；文字 SSE 不受影响。
- 没有麦克风权限：直接在 AI 助手文本框提问，仍可复习 SSE 与流式 TTS。

## 常见报错

- `Cannot find package ...`：不要在 lesson 内安装。回到项目根目录恢复根依赖。
- `AuthFailure.SecretIdNotFound`：确认根 `.env` 中存在 `SECRET_ID`、`SECRET_KEY`，并从仓库提供的脚本启动。
- 流式 TTS 连接失败：检查 `APP_ID`、`TTS_VOICE_TYPE` 和腾讯云服务权限。
- ASR 格式错误：浏览器录音示例优先发送 `ogg-opus`；文件示例读取的是 `output.mp3`，两条路径的 `VoiceFormat` 不同。
- 页面有文字但没有语音：先看 `/tts` WebSocket 是否建立，再看服务端是否收到 `sessionId` 和腾讯云 `ready` 消息。

## 关键结论

- “整段 TTS”适合短文本；Agent 回答应优先使用流式 TTS。
- ASR 常见交互是用户说完后再识别，不一定需要实时流式。
- SSE 是文本协议，不适合直接承载大量二进制音频。
- Nest 事件把模型流与 TTS relay 解耦；`sessionId` 负责把一次 SSE 回答和对应的 WebSocket 客户端关联起来。
- MediaSource 与 SourceBuffer 让浏览器可以边收到音频边播放。

完整的文章对齐、代码调用链和本轮自检见 [REVIEW_NOTES.md](./REVIEW_NOTES.md)。
