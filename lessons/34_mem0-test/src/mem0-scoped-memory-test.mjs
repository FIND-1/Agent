/**
 * Mem0 三种记忆作用域示例
 *
 * 这个文件用于验证三类记忆如何隔离存取：
 * 1. userId：用户层记忆，长期跟随某个用户，可跨会话复用。
 * 2. userId + runId：会话层记忆，只属于某一次对话或任务。
 * 3. agentId：Agent 层记忆，属于某个助手角色。
 *
 * 三者是不同维度的隔离键，可以按业务需要单独使用或组合使用。
 *
 * 推荐运行顺序：
 * 1. node src/mem0-scoped-memory-test.mjs add
 * 2. 等待几秒，让 Mem0 完成异步记忆处理。
 * 3. node src/mem0-scoped-memory-test.mjs search
 * 4. node src/mem0-scoped-memory-test.mjs --cleanup
 *
 * 注意：
 * - add 默认会从对话中抽取记忆，不是简单保存原始聊天记录。
 * - search 是语义检索，不是精确字符串匹配。
 * - filters 用于限制检索范围，防止不同用户、会话或 Agent 的记忆混在一起。
 */
import "dotenv/config";
import { MemoryClient } from "mem0ai";

// userId：用户层作用域，适合姓名、城市、长期偏好、习惯等信息。
// runId：会话层作用域，适合当前任务、临时目标和本次对话进度。
// agentId：Agent 层作用域，适合助手角色、专业领域和回答风格。
const USER_ID = "mem0_test_user";
const RUN_ID = "mem0_test_session";
const AGENT_ID = "mem0_test_agent";

// 统一格式化输出，便于比较三种作用域下各个 API 的结果。
function log(title, data) {
    console.log(`\n===${title}===`);
    console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function addUserMemory(client) {
    // 用户层记忆通常是跨会话仍然有效的稳定信息。
    const messages = [
        { role: "user", content: "我叫小明，住在杭州，平时喜欢骑行和摄影。" },
        { role: "assistant", content: "好的，已记住你的姓名、城市和爱好。" },
    ];

    // 只传 userId，将 Mem0 抽取出的事实关联到该用户。
    const added = await client.add(messages, { userId: USER_ID });
    log("用户记忆 — add", added);
}

async function searchUserMemory(client){
    // filter 字段使用 snake_case；这里只检索 USER_ID 对应的用户层记忆。
    const searched = await client.search("用户住在哪里，有什么爱好", {
        filters: { user_id: USER_ID },
        topK: 5,
    });
    log("用户记忆 — search", searched.results?.map((m) => m.memory) ?? []);

    // getAll 不做语义排序，按过滤条件列出该作用域下的记忆。
    const listed = await client.getAll({ filters: { user_id: USER_ID }, pageSize: 5 });
    log("用户记忆 — getAll", listed.results?.map((m) => m.memory) ?? []);
}

async function addSessionMemory(client){
    // 会话层内容只对当前任务有用，不应直接成为用户的长期画像。
    const messages = [
        { role: "user", content: "这次聊天先帮我把季度总结的大纲列出来，重点写 Q1 的项目复盘。" },
        { role: "assistant", content: "明白，我们先围绕 Q1 项目复盘整理季度总结大纲。" },
    ];

    // 同时传 userId 和 runId，把记忆限定到该用户的本次会话。
    const added = await client.add(messages, { userId: USER_ID, runId: RUN_ID });
    log("会话记忆 — add", added);
}

async function searchSessionMemory(client){
    // 会话层检索同时限定 user_id 和 run_id，避免混入其他用户或其他会话。
    // AND 表示两个作用域条件必须同时满足。
    const searched = await client.search("这次对话要先做什么", {
        filters: { AND: [{ user_id: USER_ID }, { run_id: RUN_ID }] },
        topK: 5,
    });
    log("会话记忆 — search", searched.results?.map((m) => m.memory) ?? []);

    // getAll 使用相同过滤条件，便于核对当前会话到底保存了哪些记忆。
    const listed = await client.getAll({
        filters: { AND: [{ user_id: USER_ID }, { run_id: RUN_ID }] },
        pageSize: 5,
    });
    log("会话记忆 — getAll", listed.results?.map((m) => m.memory) ?? []);
}

async function addAgentMemory(client){
    // Agent 层记忆描述助手本身，而不是某个用户或某次会话。
    const messages = [
        { role: "user", content: "你现在是旅行规划助手，回答时多给具体建议和备选方案。" },
        { role: "assistant", content: "好的，我会以旅行规划助手的身份，提供具体建议和备选方案。" },
    ];

    // 只传 agentId，将抽取出的角色设定关联到指定 Agent。
    const added = await client.add(messages, { agentId: AGENT_ID });
    log("Agent 记忆 — add", added);
}

async function searchAgentMemory(client){
    // 仅限定 agent_id，检索该助手角色自己的记忆。
    const searched = await client.search("这个 Agent 的角色和回答方式", {
        filters: { agent_id: AGENT_ID },
        topK: 5,
    });
    log("Agent 记忆 — search", searched.results?.map((m) => m.memory) ?? []);

    // 列出该 Agent 作用域下的记忆，适合调试角色设定是否正确保存。
    const listed = await client.getAll({ filters: { agent_id: AGENT_ID }, pageSize: 5 });
    log("Agent 记忆 — getAll", listed.results?.map((m) => m.memory) ?? []);
}

async function main(){
    if (!process.env.MEM0_API_KEY) {
        console.error("缺少 MEM0_API_KEY");
        process.exit(1);
    }

    // 使用 .env 中的 API Key 创建 Mem0 Platform 云端客户端。
    const client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });

    // 第一个命令行参数决定执行写入还是查询；未指定时默认执行 add。
    // add 与 search 分开运行，是因为云端记忆抽取可能尚未立即完成。
    const action = process.argv[2] ?? "add";

    // 清理三种作用域的测试数据，避免重复运行后旧数据干扰观察结果。
    // 这是破坏性操作，因此只在显式传入 --cleanup 时执行。
    if (process.argv.includes("--cleanup")) {
        await client.deleteAll({ userId: USER_ID });
        await client.deleteAll({ userId: USER_ID, runId: RUN_ID });
        await client.deleteAll({ agentId: AGENT_ID });
        log("清理完成", { USER_ID, RUN_ID, AGENT_ID });
        return;
    }

    if (action === "add") {
        // 依次提交三种作用域的记忆抽取任务。
        await addUserMemory(client);
        await addSessionMemory(client);
        await addAgentMemory(client);
        console.log("\nadd 已提交（异步处理），稍后再运行: pnpm scoped-memory search");
        return;
    }

    if (action === "search") {
        // 使用各自对应的 filters 分别验证三种作用域的数据隔离。
        await searchUserMemory(client);
        await searchSessionMemory(client);
        await searchAgentMemory(client);
        return;
    }

    console.error(`未知命令:${action}，可用: add | search | --cleanup`);
    process.exit(1);
}

// 统一输出初始化、网络和 API 调用错误。
main().catch((error) => {
    console.error("\n执行失败:", error.message ?? error);
    if (error.suggestion) console.error("建议:", error.suggestion);
    process.exit(1);
});
