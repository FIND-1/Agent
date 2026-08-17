import { countTerms, tokenize } from './_shared/search-utils.mjs';

/**
 * 在倒排索引找到候选文档后，还需要回答“哪个结果更相关”。
 * 本例实现教学版 BM25，观察词频饱和、文档长度归一化和稀有词权重三项策略。
 * 相比 00，本例新增相关性排序；真实 Elasticsearch 的实现还包含 analyzer、字段统计等完整细节。
 */
const documents = [
  { id: 'A', text: 'RAG 检索 检索 检索' },
  { id: 'B', text: 'Elasticsearch IK 分词 BM25 检索' },
  { id: 'C', text: 'Elasticsearch IK 分词 是 中文 关键词 检索 的 重要 工具' },
];
const queryTerms = tokenize('IK 分词 检索');
const tokenizedDocuments = documents.map((document) => ({
  ...document,
  tokens: tokenize(document.text),
}));
const averageLength =
  tokenizedDocuments.reduce((sum, document) => sum + document.tokens.length, 0) /
  tokenizedDocuments.length;

function inverseDocumentFrequency(term) {
  const matchingDocuments = tokenizedDocuments.filter((document) =>
    document.tokens.includes(term),
  ).length;

  return Math.log(
    1 +
      (tokenizedDocuments.length - matchingDocuments + 0.5) /
        (matchingDocuments + 0.5),
  );
}

function bm25(document, k1 = 1.2, b = 0.75) {
  const termCounts = countTerms(document.tokens);

  return queryTerms.reduce((score, term) => {
    const frequency = termCounts.get(term) ?? 0;
    const lengthNormalization =
      frequency + k1 * (1 - b + b * (document.tokens.length / averageLength));
    const saturatedFrequency =
      frequency === 0 ? 0 : (frequency * (k1 + 1)) / lengthNormalization;

    return score + inverseDocumentFrequency(term) * saturatedFrequency;
  }, 0);
}

const ranking = tokenizedDocuments
  .map((document) => ({
    id: document.id,
    text: document.text,
    score: bm25(document).toFixed(4),
  }))
  .sort((left, right) => Number(right.score) - Number(left.score));

console.log(`查询词：${queryTerms.join(', ')}`);
console.table(ranking);
