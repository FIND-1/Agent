# Lesson 21 复习与整理记录

## 文章主线

原文《给 Agent 加上语音交互：ASR + 流式 TTS》从一次性 TTS 开始，用它说明语音合成请求和音频落盘；随后指出 Agent 的模型回答是流式文本，因此 TTS 也要升级为 WebSocket 流式合成。接着加入“说完再识别”的 ASR，最后在 Nest 应用里用四段链路组合完整交互：

1. 浏览器 `MediaRecorder` 录音，以 `FormData` 上传。
2. Nest 调腾讯云 ASR，把音频转为用户问题。
3. LangChain 生成回答，通过 SSE 流式返回文字。
4. 同一批文字 chunk 经 Nest 事件送入 TTS relay，再通过独立 WebSocket 把二进制音频推给浏览器。

文章最重要的工程判断是：文字和音频不要挤在同一条 SSE 通道。SSE 继续负责文本，WebSocket 负责二进制语音。

## 代码对应关系

### 基础示例

- `src/00-tts-to-file.mjs`：对应文章的普通 `TextToVoice`，输出 `output.mp3`。
- `src/01-streaming-tts-to-file.mjs`：对应 `TextToStreamAudioWSv2`，演示签名、文本分片、二进制写流。
- `src/02-asr-from-file.mjs`：对应 `SentenceRecognition`，读取 `output.mp3` 并输出识别文本。
- `src/_shared/env.mjs`：集中加载根 `.env`、校验必填变量并解析 `TTS_VOICE_TYPE`。

### Nest 完整示例

本 lesson 同时包含多个编号脚本和一个独立 Nest 应用。Nest 部分不按文件编号复习，应按调用链阅读：

1. `src/main.ts`：启动 Nest，挂载本地 `/tts` WebSocket。
2. `src/app.module.ts`：加载根 `.env`、静态页面、事件总线、AI 与 Speech 模块。
3. `src/speech/speech.module.ts -> speech.controller.ts -> speech.service.ts`：理解文件上传与 ASR。
4. `src/ai/ai.module.ts -> ai.controller.ts -> ai.service.ts`：理解模型 provider、SSE 与 TTS 事件发送。
5. `src/common/stream-events.ts -> src/speech/tts-relay.service.ts`：理解事件协议、腾讯云 WebSocket 和客户端音频转发。
6. `public/ai-assistant.html`：观察前端如何用 `sessionId` 关联 SSE 与 TTS WebSocket，并用 MediaSource 播放。

## 本轮整理

- 将三个基础脚本按文章递进关系编号并重新命名。
- 修复原始粘贴代码中的 `returnnew`、`thrownew`、`exportclass`、缺少空格、混入中文说明等语法问题。
- 把三个脚本重复的根环境加载与变量校验抽到 `src/_shared/env.mjs`。
- 把用户新增的无效键名 `TTS VOICE_TYPE` 更正为 `TTS_VOICE_TYPE=502006`。
- 让普通 TTS、独立流式 TTS、Nest relay 都读取同一个音色配置。
- 修复 ASR `DataLen`：传原始音频 Buffer 的字节长度，而不是 Base64 字符串长度。
- 完成 Nest 静态资源、SSE、事件总线、本地 WebSocket 与腾讯云 TTS relay 的连接。
- 为“AI 已结束但腾讯云 WebSocket 尚未 ready”的情况增加延迟完成标记，避免漏发 `ACTION_COMPLETE`。
- 补齐浏览器端流式音频播放，并保留不支持 MediaSource 时的 Blob 降级路径。

## `_shared/` 抽离判断

已检查模型初始化、环境变量读取、schema、examples、prompt block 和工具函数：

- 三个基础脚本重复读取根 `.env` 和腾讯云变量，因此抽离为 `src/_shared/env.mjs`。
- Nest 使用 `ConfigService` 和依赖注入，生命周期与独立 MJS 脚本不同，不强行复用脚本的 `_shared`。
- WebSocket 签名在独立 MJS 与 Nest 服务各出现一次，但它们跨运行时、跨教学阶段；保留在各自示例中更容易沿文章顺序阅读。
- 当前没有重复 schema、examples 或编号示例互相 import 的情况。

## 依赖与环境边界

- 所有 Node 依赖只安装在仓库根目录。
- lesson 内不得保留独立 `node_modules`。
- 所有环境变量来自根 `.env`，lesson 内不创建 `.env` 或 `.env.example`。
- 真实运行依赖腾讯云语音 API；完整页面还依赖兼容 OpenAI API 的模型服务和浏览器麦克风权限。

## fallback

- 仅做静态复习：运行 MJS 语法检查和 Nest 编译，不触发外部请求。
- 只有腾讯云凭证：复习前三个编号脚本和 ASR 页面。
- 只有模型 API：不传 `sessionId` 调 `/ai/chat/stream`，AI 服务会降级为纯文字 SSE。
- MediaSource 不支持 MP3：浏览器在 TTS 完成后用 Blob 整段播放。

## 自检清单

- [x] 文章主线与代码文件建立对应关系。
- [x] 核心示例有复习型注释。
- [x] 重复环境读取已抽离到非空 `_shared/`。
- [x] 编号示例之间不存在互相 import。
- [x] lesson 根目录复习文档限定为 `README.md`、`REVIEW_NOTES.md`。
- [x] README 按语法检查、腾讯云 API、模型与腾讯云 API、fallback 分类。
- [x] README 说明根 `.env` 和 `TTS_VOICE_TYPE=502006`。
- [x] 外部服务失败时有纯文字、静态阅读和 Blob 播放路径。
- [x] 缺失依赖已安装到根目录，Lesson 21 内 `node_modules` 数量为 0。
- [x] 四个 MJS 文件均通过 `node --check`，Nest 服务通过 TypeScript 编译。
- [x] Nest 启动冒烟通过：静态页面返回 HTTP 200，本地 `/tts` WebSocket 返回有效 `sessionId`。
