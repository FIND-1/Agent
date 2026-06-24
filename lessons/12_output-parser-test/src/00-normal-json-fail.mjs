import { createChatModel } from './_shared/model.mjs'

/**
 * 00. 反例：只在 prompt 里要求模型返回 JSON
 *
 * 文章第一步就是演示这个问题：
 * - 你要求模型返回 JSON
 * - 但模型可能返回 ```json 代码块
 * - 这时直接 JSON.parse(response.content) 就会失败
 *
 * 这个文件的价值：不是推荐这么写，而是让你记住为什么需要 Output Parser / Tool Calls。
 */
const model = createChatModel()

const question =
  '请介绍一下爱因斯坦的信息。请以 JSON 格式返回，包含以下字段：name（姓名）、birth_year（出生年份）、nationality（国籍）、major_achievements（主要成就，数组）、famous_theory（著名理论）。'

try {
  console.log('🤔 正在调用大模型：只靠 prompt 要求 JSON...\n')

  const response = await model.invoke(question)

  console.log('📤 模型原始响应：\n')
  console.log(response.content)

  /**
   * 这里故意保留 JSON.parse：
   * 如果模型返回 markdown 代码块，这里大概率会报错。
   */
  const jsonResult = JSON.parse(response.content)

  console.log('\n✅ 解析后的 JSON 对象：')
  console.log(jsonResult)
} catch (error) {
  console.error('\n❌ 解析失败：', error.message)
  console.error('复习重点：这就是 Output Parser 出场的原因。')
}
