import { tokenize } from "../_shared/search-utils.mjs";

/**
 * 问题起点：正向存储便于按文档读取，却不适合快速回答“某个词出现在哪些文档”。
 * 本例把“文档 -> 词语”翻转成“词语 -> 文档 ID”，演示 Elasticsearch 全文检索的核心结构。
 * 相比真实 ES，本例没有 IK 中文分词、持久化、分布式能力与相关性排序，只适合离线复习原理。
 */
const documents = [
  { id: "1001", text: "RAG 向量 检索" },
  { id: "1002", text: "RAG 关键词 检索" },
  { id: "1003", text: "Elasticsearch 关键词 检索" },
];

const invertedIndex = new Map();

for (const document of documents) {
  for (const term of new Set(tokenize(document.text))) {
    const documentIds = invertedIndex.get(term) ?? new Set();
    documentIds.add(document.id);
    invertedIndex.set(term, documentIds);
  }
}

const queryTerms = tokenize("RAG 检索");
const matchedDocumentIds = queryTerms
  .map((term) => invertedIndex.get(term) ?? new Set())
  .reduce((left, right) => left.intersection(right));

console.log("倒排索引：");
console.table(
  [...invertedIndex].map(([term, documentIds]) => ({
    term,
    documentIds: [...documentIds].join(", "),
  })),
);
console.log("同时包含查询词的文档：", [...matchedDocumentIds]);
