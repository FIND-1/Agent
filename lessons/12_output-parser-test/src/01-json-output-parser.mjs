import { JsonOutputParser } from '@langchain/core/output_parsers'
import { createChatModel } from '@lessons/shared/model'

/**
 * 01. JsonOutputParser
 *
 * 适用场景：
 * - 只需要把模型返回内容解析成 JSON
 * - schema 不复杂，暂时不需要字段级描述或 Zod 校验
 *
 * 文章重点：
 * JsonOutputParser 能处理一些常见的模型输出问题，比如返回内容被 ```json 包起来。
 */
const model = createChatModel()
const parser = new JsonOutputParser()

const question = `请介绍一下爱因斯坦的信息。请以 JSON 格式返回，包含以下字段：name（姓名）、birth_year（出生年份）、nationality（国籍）、major_achievements（主要成就，数组）、famous_theory（著名理论）。

${parser.getFormatInstructions()}`

try {
  console.log('🤔 正在调用大模型：JsonOutputParser 示例...\n')

  const response = await model.invoke(question)

  console.log('📤 模型原始响应：\n')
  console.log(response.content)

  /**
   * parser.parse 会尝试从模型文本里提取并解析 JSON。
   * 相比 JSON.parse(response.content)，它对常见 markdown 包裹更宽容。
   */
  const result = await parser.parse(response.content)

  console.log('\n✅ JsonOutputParser 解析结果：')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('❌ 错误：', error.message)
}
