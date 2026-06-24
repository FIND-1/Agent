import { z } from 'zod'

/**
 * 文章中最常用的简单科学家 schema。
 * 适合演示：StructuredOutputParser、Tool Calls、withStructuredOutput。
 */
export const simpleScientistSchema = z.object({
  name: z.string().describe('科学家的全名'),
  birth_year: z.number().describe('出生年份'),
  nationality: z.string().describe('国籍'),
  fields: z.array(z.string()).describe('研究领域列表'),
})

/**
 * 用于演示复杂对象结构的 schema。
 * 重点是让你看到 Zod 可以表达：数组、对象、可选字段、嵌套对象。
 */
export const complexScientistSchema = z.object({
  name: z.string().describe('科学家的全名'),
  birth_year: z.number().describe('出生年份'),
  death_year: z.number().optional().describe('去世年份，如果还在世则不填'),
  nationality: z.string().describe('国籍'),
  fields: z.array(z.string()).describe('研究领域列表'),
  awards: z
    .array(
      z.object({
        name: z.string().describe('奖项名称'),
        year: z.number().describe('获奖年份'),
        reason: z.string().optional().describe('获奖原因'),
      }),
    )
    .describe('获得的重要奖项列表'),
  major_achievements: z.array(z.string()).describe('主要成就列表'),
  famous_theories: z
    .array(
      z.object({
        name: z.string().describe('理论名称'),
        year: z.number().optional().describe('提出年份'),
        description: z.string().describe('理论简要描述'),
      }),
    )
    .describe('著名理论列表'),
  education: z
    .object({
      university: z.string().describe('主要毕业院校'),
      degree: z.string().describe('学位'),
      graduation_year: z.number().optional().describe('毕业年份'),
    })
    .optional()
    .describe('教育背景'),
  biography: z.string().describe('简短传记，100 字以内'),
})

/**
 * 流式示例中使用的音乐家 schema。
 */
export const musicianSchema = z.object({
  name: z.string().describe('姓名'),
  birth_year: z.number().describe('出生年份'),
  death_year: z.number().describe('去世年份'),
  nationality: z.string().describe('国籍'),
  occupation: z.string().describe('职业'),
  famous_works: z.array(z.string()).describe('著名作品列表'),
  biography: z.string().describe('简短传记'),
})

/**
 * Tool Calls 流式示例使用的 schema。
 */
export const toolScientistSchema = z.object({
  name: z.string().describe('科学家的全名'),
  birth_year: z.number().describe('出生年份'),
  death_year: z.number().optional().describe('去世年份，如果还在世则不填'),
  nationality: z.string().describe('国籍'),
  fields: z.array(z.string()).describe('研究领域列表'),
  achievements: z.array(z.string()).describe('主要成就'),
  biography: z.string().describe('简短传记'),
})
