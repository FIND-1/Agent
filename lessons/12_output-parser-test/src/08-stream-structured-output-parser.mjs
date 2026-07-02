import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { createChatModel, getChunkText } from '@lessons/shared/model'
import { musicianSchema } from './_shared/schemas.mjs'

/**
 * 08. 流式打印 + Output Parser 最终解析
 *
 * 这是文章里更适合“流式展示”的方案：
 *
 * 1. 用 model.stream(prompt) 让内容实时输出
 * 2. 同时把 chunk 拼成 fullContent
 * 3. 流结束后，用 parser.parse(fullContent) 得到结构化对象
 *
 * 对前端项目的启发：
 * - SSE / WebSocket 阶段可以先展示文本
 * - 完整内容落库或生成完成后，再做结构化解析
 */
const model = createChatModel()
const parser = StructuredOutputParser.fromZodSchema(musicianSchema)

const prompt = `详细介绍莫扎特的信息。

${parser.getFormatInstructions()}`

try {
  const stream = await model.stream(prompt)

  let fullContent = ''
  let chunkCount = 0

  console.log('📡 接收流式文本：\n')

  for await (const chunk of stream) {
    chunkCount += 1
    const content = getChunkText(chunk)
    fullContent += content

    process.stdout.write(content)
  }

  console.log(`\n\n✅ 共接收 ${chunkCount} 个数据块`)

  const result = await parser.parse(fullContent)

  console.log('\n📊 流结束后解析出的结构化结果：')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('\n❌ 错误：', error.message)
}
