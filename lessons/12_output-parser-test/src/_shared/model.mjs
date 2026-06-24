import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'

/**
 * 统一读取环境变量，避免每个示例文件都重复校验。
 *
 * 必需变量：
 * - OPENAI_API_KEY：模型接口密钥
 * - OPENAI_BASE_URL：OpenAI 兼容接口地址
 * - MODEL_NAME：模型名称，例如 qwen-plus / deepseek-chat 等
 */
const requiredEnv = ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'MODEL_NAME']

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`缺少环境变量：${key}，请先检查 .env 文件`)
  }
}

/**
 * 创建 ChatOpenAI 实例。
 *
 * 说明：
 * - 新版 @langchain/openai 推荐使用 model 字段。
 * - configuration.baseURL 用于接入 OpenAI 兼容接口。
 * - temperature: 0 可以降低随机性，方便观察结构化输出效果。
 */
export function createChatModel() {
  return new ChatOpenAI({
    model: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  })
}

/**
 * 兼容不同模型返回的 chunk.content 形态。
 * 大多数文本模型返回 string；部分模型可能返回数组结构。
 */
export function getChunkText(chunk) {
  if (typeof chunk.content === 'string') return chunk.content
  if (Array.isArray(chunk.content)) {
    return chunk.content
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item.text === 'string') return item.text
        return ''
      })
      .join('')
  }
  return ''
}
