/**
 * 长时记忆示例1：使用 FileSystemChatMessageHistory 将对话持久化到本地文件
 */

import "@lessons/shared/env-loader";
import { createChatModel } from "@lessons/shared/model";
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import path from "node:path";

const model = createChatModel();

async function fileHistoryDemo() {
    // 指定存储文件的路径
    const filePath = path.join(process.cwd(), "chat_history.json");
    const sessionId = "user_session_001";

    // 系统提示词
    const systemMessage = new SystemMessage(
        "你是一个友好的做菜助手，喜欢分享美食和烹饪技巧。"
    );

    console.log("[第一轮对话]");
    const history = // 初始化文件持久化记忆
new FileSystemChatMessageHistory({
        filePath: filePath,
        sessionId: sessionId,
    });

    const userMessage1 = new HumanMessage(
        "红烧肉怎么做"
    );
    // 将消息写入 memory
    await history.addMessage(userMessage1);

    const messages1 = [systemMessage, ...(// 读取全部历史 messages
    await history.getMessages())];
    const response1 = await model.invoke(messages1);
    // 将消息写入 memory
    await history.addMessage(response1);

    console.log(`用户: ${userMessage1.content}`);
    console.log(`助手: ${response1.content}`);
    console.log(`✓ 对话已保存到文件: ${filePath}\n`);

    console.log("[第二轮对话]");
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

    console.log(`用户: ${userMessage2.content}`);
    console.log(`助手: ${response2.content}`);
    console.log(`✓ 对话已更新到文件\n`);
}

fileHistoryDemo().catch(console.error);


