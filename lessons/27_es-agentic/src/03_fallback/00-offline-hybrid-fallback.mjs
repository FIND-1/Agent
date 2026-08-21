/**
 * 无外部依赖 fallback：用本地启发式分数模拟“关键词召回 + 语义召回 + 合并去重 + 重排”。
 * 它只用于复习数据流，不具备 IK、向量嵌入或真实 Rerank 模型的检索质量。
 */
const documents = [
  {
    id: "local_01",
    title: "雨天玄关除湿",
    body: "湿鞋先放沥水盘，地垫下铺旧报纸吸湿，并保持开窗对流。",
  },
  {
    id: "local_02",
    title: "衣柜换季防潮",
    body: "衣物使用透气防尘袋，抽屉里铺吸潮纸，避免樟脑丸直接接触衣物。",
  },
  {
    id: "local_03",
    title: "自驾后备厢清单",
    body: "准备折叠椅、保温箱、饮用水、充气泵和备用手机支架。",
  },
  {
    id: "local_04",
    title: "冰箱密封条维护",
    body: "密封条闭合不紧时检查型号，安装后用热风帮助定型。",
  },
];

const query = "下雨回家后，玄关的湿鞋和潮气怎么处理？";
const expandedQueries = [
  query,
  "雨天玄关如何除湿",
  "湿鞋怎样沥水防臭",
  "门口怎样通风防潮",
];

function characters(text) {
  return new Set(String(text).replace(/[\s，。？！、]/g, ""));
}

function overlapScore(left, right) {
  const leftChars = characters(left);
  const rightChars = characters(right);
  let overlap = 0;
  for (const char of leftChars) if (rightChars.has(char)) overlap += 1;
  return overlap / Math.max(1, leftChars.size);
}

function recall(searchQueries, scorer, limit = 3) {
  return documents
    .map((document) => ({
      ...document,
      score: Math.max(
        ...searchQueries.map((item) =>
          scorer(item, `${document.title}${document.body}`),
        ),
      ),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function mergeById(...groups) {
  return [
    ...new Map(
      groups.flat().map((document) => [document.id, document]),
    ).values(),
  ];
}

const keywordHits = recall(expandedQueries, overlapScore);
const semanticFallbackHits = recall(expandedQueries, (question, text) =>
  overlapScore(question.replace("怎么", "如何"), text),
);
const merged = mergeById(keywordHits, semanticFallbackHits);
const reranked = merged
  .map((document) => ({
    ...document,
    score: overlapScore(query, document.body),
  }))
  .sort((left, right) => right.score - left.score)
  .slice(0, 2);
const context = reranked
  .map(
    (document, index) => `[${index + 1}] ${document.title}\n${document.body}`,
  )
  .join("\n\n");
const prompt = `请只根据检索片段回答问题；资料不足时明确说明。\n\n问题：${query}\n\n检索片段：\n${context}`;

console.log("查询扩展：", expandedQueries);
console.log(
  "关键词召回 ID：",
  keywordHits.map((document) => document.id),
);
console.log(
  "语义 fallback 召回 ID：",
  semanticFallbackHits.map((document) => document.id),
);
console.log(
  "合并去重 ID：",
  merged.map((document) => document.id),
);
console.log(
  "重排保留 ID：",
  reranked.map((document) => document.id),
);
console.log("\n最终组装的 Prompt：\n");
console.log(prompt);
