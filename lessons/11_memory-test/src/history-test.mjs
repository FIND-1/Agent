/**
 * 短期内存示例：使用 InMemoryChatMessageHistory 实现对话上下文管理（内存级 memory）
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = createChatModel();

async function inMemoryDemo() {
    const history = new InMemoryChatMessageHistory() // 初始化短期对话记忆（内存）;

    const systemMessage = new SystemMessage(
        "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。"
    );

    // 第一轮对话
    console.log("[第一轮对话]");
    const userMessage1 = new HumanMessage(
        "你今天吃的什么？"
    );
    // 将消息写入 memory
    await history.addMessage(userMessage1);

    const messages1 = [systemMessage, ...(// 读取全部历史 messages
    await history.getMessages())];
    const response1 = await model.invoke(messages1);
    // 将消息写入 memory
    await history.addMessage(response1);

    console.log(`用户: ${userMessage1.content}`);
    console.log(`助手: ${response1.content}\n`);

    // 第二轮对话（基于历史记录）
    console.log("[第二轮对话 - 基于历史记录]");
    const userMessage2 = new HumanMessage(
        "好吃吗？"
    );
    // 将消息写入 memory
    await history.addMessage(userMessage2);

    const messages2 = [systemMessage, ...(// 读取全部历史 messages
    await history.getMessages())];
    const response2 = await model.invoke(messages2);
    // 将消息写入 memory
    await history.addMessage(response2);

    console.log(`用户: ${userMessage2.content}`);
    console.log(`助手: ${response2.content}\n`);

    // 展示所有历史消息
    console.log("[历史消息记录]");
    const allMessages = // 读取全部历史 messages
    await history.getMessages();
    console.log(`共保存了 ${allMessages.length} 条消息：`);
    allMessages.forEach((msg, index) => {
        const type = msg.type;
        const prefix = type === 'human' ? '用户' : '助手';
        console.log(`  ${index + 1}. [${prefix}]: ${msg.content.substring(0, 50)}...`);
    });
}

inMemoryDemo().catch(console.error);


