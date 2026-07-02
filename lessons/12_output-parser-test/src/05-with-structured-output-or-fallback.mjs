import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { createChatModel } from '@lessons/shared/model'
import { simpleScientistSchema } from './_shared/schemas.mjs'

/**
 * 05. withStructuredOutput：推荐 API，但要结合接口兼容性
 *
 * 文章结论：
 * 如果只是要结构化 JSON，优先考虑 withStructuredOutput。
 *
 * 你的实际情况：
 * 之前运行 stream-with-structured-output.mjs 时出现过：
 *   400 This response_format type is unavailable now
 *
 * 所以这里做成“优先 withStructuredOutput，失败后 fallback 到 StructuredOutputParser”。
 */
const model = createChatModel()

async function invokeWithStructuredOutput() {
  const structuredModel = model.withStructuredOutput(simpleScientistSchema)
  return structuredModel.invoke('介绍一下爱因斯坦')
}

async function invokeWithParserFallback() {
  const parser = StructuredOutputParser.fromZodSchema(simpleScientistSchema)

  const prompt = ChatPromptTemplate.fromTemplate(`
请介绍一下爱因斯坦。

你必须严格按照下面的格式要求返回：

{format_instructions}

额外要求：
1. 只返回 JSON
2. 不要返回 markdown
3. 不要使用 \`\`\`json 代码块
4. 不要添加解释
`)

  const chain = prompt.pipe(model).pipe(parser)

  return chain.invoke({
    format_instructions: parser.getFormatInstructions(),
  })
}

try {
  console.log('🤔 优先尝试 withStructuredOutput...\n')

  const result = await invokeWithStructuredOutput()

  console.log('✅ withStructuredOutput 成功：')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.warn('⚠️ withStructuredOutput 调用失败：', error.message)
  console.warn('开始降级为 StructuredOutputParser...\n')

  try {
    const result = await invokeWithParserFallback()

    console.log('✅ fallback 成功：')
    console.log(JSON.stringify(result, null, 2))
  } catch (fallbackError) {
    console.error('❌ fallback 也失败：', fallbackError.message)
  }
}
