import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { createChatModel } from './_shared/model.mjs'

/**
 * 02. StructuredOutputParser.fromNamesAndDescriptions
 *
 * 适用场景：
 * - 字段较少
 * - 想明确告诉模型每个字段的含义
 * - 暂时不想引入 Zod 的复杂类型定义
 *
 * 文章重点：
 * StructuredOutputParser 会生成一大段 format instructions，放进 prompt 里约束模型输出。
 */
const model = createChatModel()

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  name: '姓名',
  birth_year: '出生年份',
  nationality: '国籍',
  major_achievements: '主要成就，用逗号分隔的字符串',
  famous_theory: '著名理论',
})

const question = `请介绍一下爱因斯坦的信息。

${parser.getFormatInstructions()}`

try {
  console.log('📋 本次 prompt 中加入的格式说明：\n')
  console.log(question)

  const response = await model.invoke(question)

  console.log('\n📤 模型原始响应：\n')
  console.log(response.content)

  const result = await parser.parse(response.content)

  console.log('\n✅ StructuredOutputParser 解析结果：')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('❌ 错误：', error.message)
}
