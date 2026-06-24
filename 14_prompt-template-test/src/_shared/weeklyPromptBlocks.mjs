import { PipelinePromptTemplate, PromptTemplate } from '@langchain/core/prompts';

// 复习重点：
// 编号示例文件不应该互相 import，否则单个示例会隐含依赖前一个编号文件的副作用。
// 这里集中保存“周报”场景可复用的 prompt blocks，编号文件只依赖 _shared。

// A. 人设模块
export const personaPrompt = PromptTemplate.fromTemplate(
  `你是一名资深工程团队负责人，写作风格：{tone}。
你擅长把枯燥的技术细节写得既专业又有温度。\n`
);

// B. 背景模块
export const contextPrompt = PromptTemplate.fromTemplate(
  `公司：{company_name}
部门：{team_name}
直接汇报对象：{manager_name}
本周时间范围：{week_range}
本周部门核心目标：{team_goal}\n`
);

// C. 周报任务模块
export const weeklyTaskPrompt = PromptTemplate.fromTemplate(
  `以下是本周团队的开发活动（Git / Jira 汇总）：
{dev_activities}

请你从这些原始数据中提炼出：
1. 本周整体成就亮点
2. 潜在风险和技术债
3. 下周重点计划建议\n`
);

// D. 周报格式模块
export const weeklyFormatPrompt = PromptTemplate.fromTemplate(
  `请用 Markdown 输出周报，结构包含：
1. 本周概览（2-3 句话的 Summary）
2. 详细拆分（按模块或项目分段）
3. 关键指标表格，表头为：模块 | 亮点 | 风险 | 下周计划

注意：
- 尽量引用一些具体数据（如提交次数、完成的任务编号）
- 语气专业，但可以偶尔带一点轻松的口吻，符合 {company_values}。
`
);

// E. 最终组合 Prompt
export const finalWeeklyPrompt = PromptTemplate.fromTemplate(
  `{persona_block}
{context_block}
{task_block}
{format_block}

现在请生成本周的最终周报：`
);

export const pipelinePrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    { name: 'persona_block', prompt: personaPrompt },
    { name: 'context_block', prompt: contextPrompt },
    { name: 'task_block', prompt: weeklyTaskPrompt },
    { name: 'format_block', prompt: weeklyFormatPrompt },
  ],
  finalPrompt: finalWeeklyPrompt,
  inputVariables: [
    'tone',
    'company_name',
    'team_name',
    'manager_name',
    'week_range',
    'team_goal',
    'dev_activities',
    'company_values',
  ],
});
