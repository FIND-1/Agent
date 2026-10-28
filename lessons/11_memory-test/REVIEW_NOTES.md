# Memory 复习笔记

## 主线

模型调用通常不自动拥有之前的对话状态：应用要把 system、用户、助手以及工具调用和工具结果等相关消息按正确顺序传入。历史存储与上下文管理是两个维度：内存存储随进程结束而消失；文件可跨进程恢复，但持久化本身不等于能自动召回、也不等同于所有长期记忆设计。

1. `InMemoryChatMessageHistory` 的 add/get 让第二次调用带上第一轮消息。
2. `FileSystemChatMessageHistory` 通过文件和 session 恢复；system 消息由示例单独拼入，不由存储自动管理。
3. 截断通过 `slice` 或 `trimMessages` 选取近期消息。示例只统计内容的 `cl100k_base` token，不含角色、工具、模型协议开销，且不同模型分词器可能不同；要给输出和其他提示预留预算，并维护工具调用与结果的完整关系。
4. 总结将旧消息转成摘要并保留最近消息。两个示例仅展示摘要生成及清理，**只打印摘要，不保存、不放入下一次调用**，不能当成完整的滚动摘要记忆；摘要可能遗漏或误写信息。
5. 检索示例先对历史对话向量化并写入 Milvus，查询时按语义检索再拼到 prompt，生成后把本轮写回。`history` 只写入未读入上下文，跨轮上下文主要依靠向量检索。检索失败被捕获并回退空结果，写入失败也只告警；运行成功的文字并不证明召回质量。历史内容需考虑租户隔离和提示注入。

文章提出定期总结后将摘要存入向量库、按需检索；当前代码展示两种策略的独立步骤，并未实现该组合。文章关于模型上下文长度及旧 Memory API 的说法具有版本和模型时效性，不应作为所有模型的固定限制。原文插图未随文本附件提供，本文按文字和代码复习。

## 原文路径与编号路径

编号仅改变排序和阶段目录，保留文件名主体和示例逻辑；`chat_history.json` 是运行时生成的聊天记录，不随仓库提供；`package.json` 是包配置，均不编号。

| 原文路径 | 复习路径 | 知识点 |
| --- | --- | --- |
| `src/history-test.mjs` | [src/00-history-test.mjs](src/00-history-test.mjs) | 内存历史 |
| `src/history-test2.mjs` | [src/01-history-test2.mjs](src/01-history-test2.mjs) | 文件写入 |
| `src/history-test3.mjs` | [src/02-history-test3.mjs](src/02-history-test3.mjs) | 文件恢复 |
| `src/memory/truncation-memory.mjs` | [src/03_memory/00-truncation-memory.mjs](src/03_memory/00-truncation-memory.mjs) | 消息数和 token 截断 |
| `src/memory/summarization-memory.mjs` | [src/03_memory/01-summarization-memory.mjs](src/03_memory/01-summarization-memory.mjs) | 消息数总结 |
| `src/memory/summarization-memory2.mjs` | [src/03_memory/02-summarization-memory2.mjs](src/03_memory/02-summarization-memory2.mjs) | token 总结 |
| `src/memory/insert-conversations.mjs` | [src/03_memory/03-insert-conversations.mjs](src/03_memory/03-insert-conversations.mjs) | 向量数据准备 |
| `src/memory/retrieval-memory.mjs` | [src/03_memory/04-retrieval-memory.mjs](src/03_memory/04-retrieval-memory.mjs) | 检索与写回 |

## 共享和验证边界

模型和 embedding 初始化、根环境变量加载复用 `lessons/_shared/model.mjs` 和 `env-loader.mjs`，分别用于本课 6 个模型调用文件、2 个 embedding 文件，超过 3 个文件的共享要求已由现有跨课模块满足。检查全课程的 `countTokens` 和 `summarizeHistory`：各出现 2 个文件，属于各策略的核心过程，保留以便对照文章；向量化包装只在 2 个检索相关文件中出现，也保留以展示完整调用链。没有编号示例互相导入。

原有注释随文件保留，补充了依赖与局限说明。依赖分类、运行命令、外部服务缺失时的阅读路径见 [README](README.md)。模型及 Milvus 请求、文件写入都涉及外部状态，不作为静态检查结果；验证时应明确区分。
