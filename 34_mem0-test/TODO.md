## TODO：Agent 记忆系统 / Mem0 + Redis

### 当前状态
- 已读到 Mem0 长期记忆章节约 1/5。
- 已理解大方向：Redis 做短期记忆，Mem0 做长期记忆。
- 当前卡点：文章后半段开始要求配置 Redis、Docker Compose、LangChain Agent，工程复杂度突然上升。

### 暂停原因
- 这篇不是纯概念章节，而是「Agent 记忆系统综合实战」。
- 当前前置知识还不够完整，直接继续容易产生心智负担。

### 已掌握概念
- User Memory：用户长期画像，比如姓名、城市、偏好、习惯。
- Session Memory：当前会话任务上下文，比如这次要做什么、讨论到哪一步。
- Agent Memory：某个 Agent 自己的角色、语气、回答方式。
- Redis：当前阶段先理解为服务端短期缓存。
- Mem0：长期记忆库，封装了语义检索、关键词检索、图谱检索等能力。:contentReference[oaicite:0]{index=0}

### 下次继续顺序
1. 不继续完整 Agent 示例。
2. 先只跑 Mem0 云端 API 示例：`add / search / getAll`。
3. 单独补 Redis 基础：key-value、TTL、Docker 启动 Redis、ioredis 读写。
4. 再回来看 Redis + Mem0 + Agent 综合代码。
5. 最后再考虑本地部署 Mem0。

### 暂不处理
- 暂不部署本地 Mem0。
- 暂不研究 RedisInsight。
- 暂不深挖知识图谱检索实现。
- 暂不把完整代码接入自己的项目。