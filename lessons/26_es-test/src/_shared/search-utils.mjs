/**
 * fallback 示例共用的极简分词函数。
 * 它只用于把英文、数字和空格分隔的中文词组标准化，不能替代 IK 的中文词典与切词能力。
 */
export function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) ?? [];
}

export function countTerms(tokens) {
  const counts = new Map();

  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return counts;
}
