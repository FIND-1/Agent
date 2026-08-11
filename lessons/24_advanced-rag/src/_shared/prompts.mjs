import { BOOK_TITLE } from "./runtime.mjs";

/** 多个示例共用的简单问答提示词；它不包含 RAG 上下文。 */
export function createDirectAnswerPrompt(question) {
  return `你是中文问答助手，请简洁回答。

问题：${question}

回答：`;
}

/** 传统、路由和多跳示例共用的证据约束，避免三处规则产生差异。 */
export function createRagAnswerPrompt(question, context) {
  return `你是《${BOOK_TITLE}》小说问答助手。
请综合检索证据回答；只能依据给定片段，证据不足时指出缺口，不要编造。

检索证据：
${context || "（没有检索到相关证据）"}

问题：${question}

回答：`;
}
