import { createChatModel } from "@lessons/shared/model";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// 复习重点：
// 这是 Runnable 之前的写法：手动执行 format -> model -> parser。
// 先理解这种过程式写法的重复和耦合，再看后续文件如何把步骤组装成 chain。

const model = createChatModel();

const schema = z.object({
  translation: z.string().describe("翻译后的英文文本"),
  keywords: z.array(z.string()).length(3).describe("3 个关键词"),
});

const outputParser = StructuredOutputParser.fromZodSchema(schema);

const promptTemplate = PromptTemplate.fromTemplate(
  "将以下文本翻译成英文，然后总结为 3 个关键词。\n\n文本：{text}\n\n{format_instructions}",
);

const input = {
  text: "LangChain 是一个强大的 AI 应用开发框架",
  format_instructions: outputParser.getFormatInstructions(),
};

const formattedPrompt = await promptTemplate.format(input);
const response = await model.invoke(formattedPrompt);
const result = await outputParser.invoke(response);

console.log("最终结果:");
console.log(result);
