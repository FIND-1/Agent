import {
  FewShotPromptTemplate,
  PromptTemplate,
} from '@langchain/core/prompts';

// 复习重点：
// Milvus + embeddings 是更接近真实项目的语义示例选择方案。
// 但复习或本地演示时，经常没有 Milvus 服务；这个文件演示一个无外部服务的 fallback。
// 它只用简单文本相似度挑示例，效果不等同于向量检索，但能保持 few-shot 组装链路可运行。

const examples = [
  {
    scenario:
      '支付系统稳定性治理，强调风险防控、告警收敛和应急预案完善。',
    report_snippet:
      '- 本周聚焦支付链路稳定性，处理线上事故并补齐告警策略；\n' +
      '- 针对高频超时接口优化重试和降级逻辑，降低核心链路风险；\n' +
      '- 完成一次应急演练，验证预案在值班场景下可执行。',
  },
  {
    scenario:
      '新功能首发，对外展示产品亮点，适合发给跨部门业务同学。',
    report_snippet:
      '- 上线运营实时看板，支持业务实时查看核心转化漏斗；\n' +
      '- 打通埋点、数仓和可视化链路，为后续精细化运营提供基础；\n' +
      '- 面向运营和市场团队组织分享，帮助非技术同学理解业务价值。',
  },
  {
    scenario:
      '技术债清理，核心工作是重构、单测补齐、文档完善，节奏偏稳。',
    report_snippet:
      '- 对老旧订单模块完成分层重构，拆出更清晰的子模块边界；\n' +
      '- 补齐核心路径单元测试，降低后续改动的回归风险；\n' +
      '- 完成系统设计文档补全，方便新人接手维护。',
  },
  {
    scenario:
      '团队协作和流程优化，比如值班轮值、需求评审、跨团队沟通。',
    report_snippet:
      '- 更新值班手册和排班机制，降低新同学接手值班的压力；\n' +
      '- 在需求评审中引入技术风险清单，更早暴露潜在问题；\n' +
      '- 联合产品和运维梳理复盘模板，让改进项更可追踪。',
  },
];

const examplePrompt = PromptTemplate.fromTemplate(
  `用户场景：{scenario}
生成的周报片段：
{report_snippet}
---`
);

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '')
      .split('')
      .filter(Boolean)
  );
}

function similarityScore(input, candidate) {
  const inputTokens = tokenize(input);
  const candidateTokens = tokenize(candidate);
  let overlap = 0;

  for (const token of inputTokens) {
    if (candidateTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(inputTokens.size, 1);
}

function selectFallbackExamples(currentScenario, k = 2) {
  return examples
    .map((example) => ({
      ...example,
      score: similarityScore(
        currentScenario,
        `${example.scenario}\n${example.report_snippet}`
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ score, ...example }) => example);
}

const currentScenario =
  '本周主要清理历史订单模块技术债，拆分老代码，补齐核心接口单测，并整理文档方便新人接手。';

const selectedExamples = selectFallbackExamples(currentScenario, 2);

const fewShotPrompt = new FewShotPromptTemplate({
  examples: selectedExamples,
  examplePrompt,
  prefix:
    '下面是本地 fallback 选出的周报示例。请学习它们的结构和表达方式，不要照搬具体内容：\n',
  suffix:
    '\n\n现在请根据上面的示例风格，为下面这个场景写一份新的周报：\n' +
    '场景描述：{current_scenario}\n' +
    '请输出一份适合发给老板和团队同步的 Markdown 周报草稿。',
  inputVariables: ['current_scenario'],
});

const finalPrompt = await fewShotPrompt.format({
  current_scenario: currentScenario,
});

console.log('本地 fallback 选中的示例：');
console.log(selectedExamples.map((example) => example.scenario));
console.log('\n===== fallback few-shot prompt =====\n');
console.log(finalPrompt);
