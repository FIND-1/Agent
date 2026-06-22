import { createChatModel } from './_shared/model.mjs'
import { musicianSchema } from './_shared/schemas.mjs'

/**
 * 07. withStructuredOutput + stream 的行为观察
 *
 * 文章重点：
 * - withStructuredOutput 更偏“最终拿到一个完整结构化对象”
 * - 即使调用 .stream()，也可能不是你想象中的逐字打字机效果
 * - 部分 OpenAI 兼容接口还可能因为 response_format / json_schema 不支持而报错
 *
 * 复习结论：
 * 如果你要做前端 SSE 打字机效果，不要默认选择 withStructuredOutput().stream()。
 */
const model = createChatModel()
const structuredModel = model.withStructuredOutput(musicianSchema)

try {
  const stream = await structuredModel.stream('详细介绍莫扎特的信息。')

  let chunkCount = 0
  let finalResult = null

  console.log('📡 接收 withStructuredOutput().stream() 返回：\n')

  for await (const chunk of stream) {
    chunkCount += 1
    finalResult = chunk

    console.log(`[Chunk ${chunkCount}]`)
    console.log(JSON.stringify(chunk, null, 2))
  }

  console.log(`\n✅ 共接收 ${chunkCount} 个数据块`)
  console.log('📊 最终结构化结果：')
  console.log(JSON.stringify(finalResult, null, 2))
} catch (error) {
  console.error('❌ 错误：', error.message)
  console.error('复习重点：如果这里出现 response_format 不可用，说明当前接口不支持该结构化输出方式。')
}
