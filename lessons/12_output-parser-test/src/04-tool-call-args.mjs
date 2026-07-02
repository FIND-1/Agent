import { createChatModel } from '@lessons/shared/model'
import { simpleScientistSchema } from './_shared/schemas.mjs'

/**
 * 04. Tool Calls 也可以拿结构化结果
 *
 * 文章重点：
 * - 这里并没有真正实现一个工具函数
 * - 只是把工具名称、描述、参数 schema 告诉模型
 * - 模型会把结构化信息放到 response.tool_calls[0].args
 *
 * 这说明：Tool Calls 不一定是“真的要调用工具”，也可以用来做结构化抽取。
 */
const model = createChatModel()

const modelWithTool = model.bindTools([
  {
    name: 'extract_scientist_info',
    description: '提取和结构化科学家的详细信息',
    schema: simpleScientistSchema,
  },
])

try {
  const response = await modelWithTool.invoke('介绍一下爱因斯坦')

  console.log('📤 response.tool_calls：')
  console.log(JSON.stringify(response.tool_calls, null, 2))

  const toolCall = response.tool_calls?.[0]

  if (!toolCall) {
    throw new Error('模型没有返回 tool_calls，请确认当前模型/接口是否支持 Tool Calls。')
  }

  const result = toolCall.args

  console.log('\n✅ 从 tool_calls[0].args 拿到的结构化结果：')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('❌ 错误：', error.message)
}
