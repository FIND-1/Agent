import { JsonOutputToolsParser } from '@langchain/core/output_parsers/openai_tools'
import { createChatModel } from '@lessons/shared/model'
import { toolScientistSchema } from './_shared/schemas.mjs'

/**
 * 10. JsonOutputToolsParser：把 tool_call_chunks 拼成对象
 *
 * 文章重点：
 * - raw tool_call_chunks 只是 JSON 参数字符串片段
 * - JsonOutputToolsParser 会尝试把这些片段持续解析成工具调用对象
 * - 这样在流式过程中，也能看到“逐步成型”的 args
 *
 * 注意：
 * 这里拿到的中间 args 可能是不完整的，只适合做渐进式展示或状态观察。
 * 真正执行业务工具时，仍建议等参数完整后再执行。
 */
const model = createChatModel()

const modelWithTool = model.bindTools([
  {
    name: 'extract_scientist_info',
    description: '提取和结构化科学家的详细信息',
    schema: toolScientistSchema,
  },
])

const parser = new JsonOutputToolsParser()
const chain = modelWithTool.pipe(parser)

try {
  const stream = await chain.stream('详细介绍牛顿的生平和成就')

  let chunkIndex = 0
  let lastSnapshot = ''

  console.log('📡 实时观察 JsonOutputToolsParser 解析结果：\n')

  for await (const chunk of stream) {
    chunkIndex += 1

    if (!chunk.length) continue

    const toolCall = chunk[0]
    const currentSnapshot = JSON.stringify(toolCall.args ?? {}, null, 2)

    /**
     * 为了复习更清晰，这里只在内容变化时打印。
     * 你也可以改成 console.log(toolCall.args)，观察每个 chunk 的变化。
     */
    if (currentSnapshot !== lastSnapshot) {
      console.log(`\n[Parsed Chunk ${chunkIndex}]`)
      console.log(currentSnapshot)
      lastSnapshot = currentSnapshot
    }
  }

  console.log('\n✅ 流式解析完成')
} catch (error) {
  console.error('\n❌ 错误：', error.message)
}
