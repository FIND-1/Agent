import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { createChatModel } from './_shared/model.mjs'
import { complexScientistSchema } from './_shared/schemas.mjs'

/**
 * 03. StructuredOutputParser.fromZodSchema
 *
 * 适用场景：
 * - 输出结构复杂
 * - 有数组、对象、可选字段、嵌套字段
 * - 希望 schema 本身也能作为代码文档
 *
 * 文章重点：
 * Zod 不只是校验工具，也是在告诉模型“你应该返回什么结构”。
 */
const model = createChatModel()
const parser = StructuredOutputParser.fromZodSchema(complexScientistSchema)

const question = `请介绍一下居里夫人（Marie Curie）的详细信息，包括她的教育背景、研究领域、获得的奖项、主要成就和著名理论。

${parser.getFormatInstructions()}`

try {
  console.log('🤔 正在调用大模型：StructuredOutputParser + Zod 示例...\n')

  const response = await model.invoke(question)

  console.log('📤 模型原始响应：\n')
  console.log(response.content)

  const result = await parser.parse(response.content)

  console.log('\n✅ 解析并校验后的结构化结果：')
  console.log(JSON.stringify(result, null, 2))

  console.log('\n📌 复习观察点：')
  console.log('- awards 是对象数组')
  console.log('- famous_theories 是对象数组')
  console.log('- education 是可选嵌套对象')
} catch (error) {
  console.error('❌ 错误：', error.message)
}
