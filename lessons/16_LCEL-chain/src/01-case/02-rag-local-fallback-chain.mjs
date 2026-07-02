import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

/**
 * 复习重点：
 * 这是为 02-rag-milvus-ebook-chain.mjs 补充的本地 fallback 示例。
 *
 * SUMMARY_RULES.txt 要求：当示例依赖 Milvus、Docker、数据库或外部 API 等
 * 容易阻塞本地复习的服务时，需要提供 fallback 说明或 fallback 示例。
 *
 * 这个文件不替代原文的 Milvus 版本，只用于在没有 Milvus 时复习 RAG 主线：
 * 选择示例片段 -> 组装 context -> PromptTemplate -> 输出答案。
 */

const ebookChunks = [
  {
    chapter_num: 10,
    content: "鸠摩智是吐蕃国师，精通小无相功，并能以此催动少林七十二绝技。",
  },
  {
    chapter_num: 11,
    content: "鸠摩智曾到天龙寺夺取六脉神剑剑谱，与段氏高手交锋。",
  },
  {
    chapter_num: 20,
    content: "段誉机缘巧合学得凌波微步和北冥神功。",
  },
];

const localSearch = RunnableLambda.from(({ question, k = 2 }) => {
  const retrievedContent = ebookChunks
    .filter((chunk) => question.includes("鸠摩智") || chunk.content.includes("鸠摩智"))
    .slice(0, k)
    .map((chunk, index) => ({
      ...chunk,
      index,
      score: 1 - index * 0.1,
    }));

  return { question, retrievedContent };
});

const buildPromptInput = RunnableLambda.from(({ question, retrievedContent }) => {
  const context = retrievedContent
    .map((item, index) => {
      return `[片段 ${index + 1}]
章节: 第 ${item.chapter_num} 章
内容: ${item.content}`;
    })
    .join("\n\n");

  return { question, context };
});

const promptTemplate = PromptTemplate.fromTemplate(
  `根据下面的小说片段回答问题。

{context}

问题：{question}

回答：`,
);

const localAnswer = RunnableLambda.from((promptValue) => {
  return `${promptValue.toString()}

本地 fallback 回答：从示例片段看，鸠摩智精通小无相功，并能用小无相功催动少林七十二绝技；他还曾试图夺取六脉神剑剑谱。`;
});

const ragFallbackChain = RunnableSequence.from([
  localSearch,
  buildPromptInput,
  promptTemplate,
  localAnswer,
  new StringOutputParser(),
]);

const result = await ragFallbackChain.invoke({
  question: "鸠摩智会什么武功？",
  k: 2,
});

console.log(result);
