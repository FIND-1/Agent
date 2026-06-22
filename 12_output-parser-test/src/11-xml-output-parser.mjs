import { XMLOutputParser } from '@langchain/core/output_parsers'
import { createChatModel } from './_shared/model.mjs'

/**
 * 11. XMLOutputParser
 *
 * 文章重点：
 * withStructuredOutput / Tool Calls 主要解决的是 JSON 结构化输出。
 * 如果业务要求 XML、YAML 等非 JSON 格式，还是要用对应的 Output Parser。
 */
const model = createChatModel()
const parser = new XMLOutputParser()

const question = `请提取以下文本中的人物信息：阿尔伯特·爱因斯坦出生于 1879 年，是一位伟大的物理学家。

${parser.getFormatInstructions()}`

try {
  console.log('📋 本次 prompt：\n')
  console.log(question)

  const response = await model.invoke(question)

  console.log('\n📤 模型原始响应：\n')
  console.log(response.content)

  const result = await parser.parse(response.content)

  console.log('\n✅ XMLOutputParser 解析结果：')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('❌ 错误：', error.message)
}
