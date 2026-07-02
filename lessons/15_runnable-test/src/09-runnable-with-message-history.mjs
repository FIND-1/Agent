import { createChatModel } from "@lessons/shared/model";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

// 复习重点：
// RunnableWithMessageHistory 给已有 chain 增加按 sessionId 隔离的消息历史。
// history 通过 MessagesPlaceholder 注入 prompt，真实项目要注意会话隔离和存储后端。

const model = createChatModel({ temperature: 0.3 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是一个简洁、有帮助的中文助手，会用 1-2 句话回答用户问题，重点给出明确、有用的信息。",
  ],
  new MessagesPlaceholder("history"),
  ["human", "{question}"],
]);

const simpleChain = prompt.pipe(model).pipe(new StringOutputParser());

const messageHistories = new Map();

const getMessageHistory = (sessionId) => {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new InMemoryChatMessageHistory());
  }
  return messageHistories.get(sessionId);
};

const chain = new RunnableWithMessageHistory({
  runnable: simpleChain,
  getMessageHistory,
  inputMessagesKey: "question",
  historyMessagesKey: "history",
});

console.log("--- 第一次对话（提供信息） ---");
const result1 = await chain.invoke(
  {
    question: "我的名字是张三，我来自山东，我喜欢编程、写作、金铲铲。",
  },
  {
    configurable: {
      sessionId: "user-123",
    },
  },
);
console.log("回答:", result1);

console.log("--- 第二次对话（询问之前的信息） ---");
const result2 = await chain.invoke(
  {
    question: "我刚才说我来自哪里？",
  },
  {
    configurable: {
      sessionId: "user-123",
    },
  },
);
console.log("回答:", result2);

console.log("--- 第三次对话（继续询问） ---");
const result3 = await chain.invoke(
  {
    question: "我的爱好是什么？",
  },
  {
    configurable: {
      sessionId: "user-123",
    },
  },
);
console.log("回答:", result3);
