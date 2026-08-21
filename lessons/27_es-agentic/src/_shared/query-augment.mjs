/**
 * Query Augmentation 节点：让 LLM 生成恰好 3 条不同角度的检索问句。
 * 它提升召回覆盖率，但会增加模型调用与检索次数；失败时退化为重复原始问题。
 */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

export const QueryAugmentationSchema = z.object({
  queries: z
    .array(z.string())
    .length(3)
    .describe(
      "恰好 3 条中文检索问句：不同角度改写或扩写；保留订单号、品牌等字面信息；不要编造事实",
    ),
});

const AUGMENT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `用户会给出一句中文问题。请另外写出恰好 3 条检索用的问句（与原意一致、角度尽量不同），便于搜索引擎或向量库分别召回：
可改写说法、换提问角度、或略加限定词；专有名词、型号、订单号等必须保留原样。
只输出结构化字段 queries（长度为 3 的字符串数组）。`,
  ],
  ["human", "{query}"],
]);

function normalizeThreeQueries(original, list) {
  const output = (list ?? [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  while (output.length < 3) output.push(original);
  return output.slice(0, 3);
}

export async function augmentQuery(chatModel, query) {
  const chain = AUGMENT_PROMPT.pipe(
    chatModel.withStructuredOutput(QueryAugmentationSchema),
  );

  try {
    const result = await chain.invoke({ query });
    return { queries: normalizeThreeQueries(query, result.queries) };
  } catch {
    return { queries: normalizeThreeQueries(query, []) };
  }
}

/** 原始问题也参与检索，因此最终共有 4 条检索串。 */
export function retrievalQueryStrings(original, augmentation) {
  return [original, ...(augmentation?.queries ?? [])]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}
