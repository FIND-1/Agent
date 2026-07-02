import { createChatModel, getChunkText } from '@lessons/shared/model'

/**
 * 06. 普通流式输出
 *
 * 文章重点：
 * - invoke 是一次性拿完整结果
 * - stream 是逐块拿 token / chunk
 * - for await...of 是读取异步流的常用写法
 */
const model = createChatModel()
const prompt = '详细介绍莫扎特的信息。'

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
  console.log(`📝 完整内容长度：${fullContent.length} 字符`)
} catch (error) {
  console.error('\n❌ 错误：', error.message)
}
