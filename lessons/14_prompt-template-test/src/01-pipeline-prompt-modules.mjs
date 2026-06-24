import { pipelinePrompt } from './_shared/weeklyPromptBlocks.mjs';

// 复习重点：
// 当 prompt 变长后，不要把角色、背景、任务、格式都堆在一个字符串里。
// PipelinePromptTemplate 的价值是把这些部分拆成可维护模块，再在 finalPrompt 中组合。
// 可复用的周报 blocks 放在 _shared/weeklyPromptBlocks.mjs，避免编号示例之间互相 import。

const pipelineFormatted = await pipelinePrompt.format({
    tone: '专业、清晰、略带幽默',
    company_name: '星航科技',
    team_name: 'AI 平台组',
    manager_name: '王总',
    week_range: '2025-02-03 ~ 2025-02-09',
    team_goal: '完成智能周报 Agent 的 MVP 版本，并打通 Git / Jira 数据源。',
    dev_activities:
        '- Git: 58 次提交，3 个主要分支合并\n' +
        '- Jira: 完成 12 个 Story，关闭 7 个 Bug\n' +
        '- 关键任务：完成智能周报 Pipeline 设计、实现 Prompt 拆分、接入 ExampleSelector',
    company_values: '「极致、开放、靠谱」的价值观',
});

console.log('PipelinePromptTemplate 组合后的 Prompt：');
console.log(pipelineFormatted);
