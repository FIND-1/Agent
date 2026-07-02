import { createChatModel } from "@lessons/shared/model";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

// 复习重点：
// LCEL 的起点是把 prompt、model、parser 组装成一条顺序 chain。
// pipe() 和 RunnableSequence.from([...]) 本质一致，都让调用方只需要 invoke 整条链。

const model = createChatModel();

const schema = z.object({
  translation: z.string().describe("翻译后的英文文本"),
  keywords: z.array(z.string()).length(3).describe("3 个关键词"),
});

const outputParser = StructuredOutputParser.fromZodSchema(schema);

const promptTemplate = PromptTemplate.fromTemplate(
  "将以下文本翻译成英文，然后总结为 3 个关键词。\n\n文本：{text}\n\n{format_instructions}",
);

// 写法一：显式声明顺序链。
// const chain = RunnableSequence.from([
//   promptTemplate,
//   model,
//   outputParser,
// ]);

// 写法二：pipe 返回的也是 RunnableSequence。
const chain = promptTemplate.pipe(model).pipe(outputParser);
console.log("chain 类型:", chain instanceof RunnableSequence ? "RunnableSequence" : chain.constructor.name);

const input = {
  text: "LangChain 是一个强大的 AI 应用开发框架",
  format_instructions: outputParser.getFormatInstructions(),
};

const result = await chain.invoke(input);

console.log("最终结果:");
console.log(result);
