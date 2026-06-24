/**
 * Mem0 基础 CRUD 示例
 *
 * 学习重点：
 * 1. add：从对话中抽取适合长期保存的记忆。
 * 2. search：根据自然语言问题进行语义检索。
 * 3. getAll：列出指定作用域下的记忆。
 * 4. get：根据记忆 ID 获取单条记忆。
 * 5. update / history：修改记忆并查看变更历史。
 * 6. deleteAll：清理测试用户的全部记忆。
 *
 * 注意：
 * - Mem0 不是简单的聊天记录数据库。默认情况下，add 会分析对话并提炼记忆。
 * - add 的处理可能是异步的，刚写入后立即 search 不一定能马上查到结果。
 * - search 是语义召回，不要求问题与记忆原文完全一致。
 */
import 'dotenv/config';
import { MemoryClient } from 'mem0ai';

// 用于隔离不同用户的长期记忆。
// 同一个 userId 下写入的记忆，后续可以通过 filters.user_id 检索出来。
// 实际项目中通常对应业务系统里的 userId / accountId。
const USER_ID = 'demo-user';

// 统一格式化输出，便于观察每个 API 返回的数据结构。
function log(title, data) {
    console.log(`\n=== ${title} ===`);
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

async function main() {
    // 创建 Mem0 Platform 云端客户端。
    // dotenv/config 会从项目根目录的 .env 加载 MEM0_API_KEY。
    // MemoryClient 连接的是 Mem0 托管服务；本地 OSS 版本使用不同的导入和配置方式。
    const client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });

    // add 接收一段对话，并从中抽取可在后续对话中复用的事实。
    // 这里预期提取出素食、坚果过敏、居住地和运动爱好等长期信息。
    const conversation = [
        { role: 'user', content: '我是素食主义者，而且对坚果过敏。' },
        { role: 'assistant', content: '好的，我会记住你的饮食偏好。' },
        { role: 'user', content: '我住在北京，平时喜欢跑步。' },
        { role: 'assistant', content: '已记录：北京、爱好跑步。' },
    ];

    // 写入示例默认保持注释，避免每次运行都重复添加测试记忆。
    // 首次测试时可取消下面两行注释；提交后等待几秒，再运行脚本进行检索。
    // userId 是 SDK 方法参数，Platform v3 的顶层参数使用 camelCase。
    // const added = await client.add(conversation, { userId: USER_ID });
    // log('添加记忆', added);

    // 按语义搜索与问题最相关的记忆。
    // filters 中的字段使用 API 过滤器命名，因此这里是 snake_case 的 user_id。
    // 该过滤条件可避免检索到其他用户的数据；topK 表示最多返回 5 条结果。
    const searchResult = await client.search('用户的饮食限制是什么？中文回答', {
        filters: { user_id: USER_ID },
        topK: 5,
    });
    log('搜索记忆', searchResult);

    // 列出当前用户作用域下已有的记忆，主要用于调试和管理。
    // search 根据问题做相关性召回，getAll 则按过滤条件分页列出数据。
    const allMemories = await client.getAll({
        filters: { user_id: USER_ID },
        pageSize: 10,
    });
    log('列出全部记忆', allMemories);

    // 优先使用 getAll 的第一条结果；如果列表为空，则尝试使用搜索结果。
    // get 需要精确的记忆 ID，不执行语义匹配。
    const firstMemory = allMemories.results?.[0] ?? searchResult.results?.[0];
    if (firstMemory?.id) {
        const memory = await client.get(firstMemory.id);
        log('获取单条记忆', memory);

        // 更新会直接修改指定记忆的文本。
        // 实际业务中通常应配合用户确认、后台审核或专门的记忆管理界面。
        // 示例默认注释，避免普通查询操作意外修改数据。
        // const updated = await client.update(firstMemory.id, {
        //     text: `${memory.memory ?? firstMemory.memory}（已通过示例脚本更新）`,
        // });
        // log('更新记忆', updated);

        // history 用于查看该记忆的创建、更新等变更记录，便于调试和审计。
        // const history = await client.history(firstMemory.id);
        // log('记忆变更历史', history);
    }

    // 传入 --cleanup 时，删除 USER_ID 作用域下的测试记忆。
    // deleteAll 是批量删除操作，只应对明确的测试用户或经确认的业务范围使用。
    if (process.argv.includes('--cleanup')) {
        const deleted = await client.deleteAll({ userId: USER_ID });
        log('清理测试数据', deleted);
    } else {
        console.log('\n提示: 运行 `node src/mem0-test.mjs --cleanup` 可删除本次测试用户的全部记忆');
    }
}

// 集中处理 Promise 异常，避免只看到未处理的 rejection。
// 部分 Mem0 错误会携带 suggestion，存在时一并输出。
main().catch((error) => {
    console.error('\n执行失败:', error.message ?? error);
    if (error.suggestion) {
        console.error('建议:', error.suggestion);
    }
    process.exit(1);
});
