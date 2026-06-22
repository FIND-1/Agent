import { createChatModel } from './_shared/model.mjs'
import { toolScientistSchema } from './_shared/schemas.mjs'

/**
 * 09. 流式 Tool Calls：直接观察 tool_call_chunks
 *
 * 文章重点：
 * 使用 Tool Calls 做结构化输出时，流式返回里会出现 tool_call_chunks。
 * 每个 chunk 里可能只有工具参数 JSON 的一小段字符串。
 *
 * 这个文件只负责“观察原始现象”：直接把 chunk.tool_call_chunks[0].args 打印出来。
 */
const model = createChatModel()

const modelWithTool = model.bindTools([
  {
    name: 'extract_scientist_info',
    description: '提取和结构化科学家的详细信息',
    schema: toolScientistSchema,
  },
])

try {
  const stream = await modelWithTool.stream('详细介绍牛顿的生平和成就')

  let chunkIndex = 0

  console.log('📡 实时输出 tool_call_chunks[].args：\n')

  for await (const chunk of stream) {
    chunkIndex += 1

    const toolCallChunk = chunk.tool_call_chunks?.[0]

    if (toolCallChunk?.args) {
      process.stdout.write(toolCallChunk.args)
    }
  }

  console.log(`\n\n✅ 流式输出完成，共读取 ${chunkIndex} 个 chunk`)
} catch (error) {
  console.error('\n❌ 错误：', error.message)
}
