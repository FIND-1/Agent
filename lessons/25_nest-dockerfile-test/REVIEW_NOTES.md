# 整理与复习记录

> 验证边界：本课依赖外部 Docker、MySQL 和 Milvus。本次未启动服务、未占用端口、未构建镜像、未创建数据库或表，也未验证 CRUD/curl/生产部署；相关步骤均保留为外部前置条件或 TODO。

## 文章主线

文章先区分三类角色：数据库保存可靠的原始业务资产，中间件补足缓存、搜索、向量检索和异步任务等专项能力，业务代码负责调度两者并对外提供服务。随后用 Docker 统一封装运行环境，再从单容器递进到 Dockerfile 自建 Nest 镜像、用多阶段构建缩小镜像，最后用 Compose 统一编排本地基础设施和生产环境中的 Nest + MySQL。

本课的最终请求链路是：

```text
public/index.html
  → /book HTTP API
  → BookController
  → BookService
  → TypeORM EntityManager
  → Book entity / MySQL books 表
```

## 推荐复习顺序

本 lesson 没有编号示例文件，因此不按文件编号复习，而按“容器递进 + Nest 模块依赖 + 请求调用链”组织：

1. `Dockerfile.single-stage`：先掌握基础指令和单阶段问题。
2. `Dockerfile`：再理解 builder/runner 分工。
3. `docker-compose.dev.yml`：识别 MySQL 与 Milvus 的端口、环境变量、数据卷和依赖。
4. `src/main.ts`、`src/app.module.ts`：理解启动入口与全局能力注册。
5. `src/book/book.module.ts`、`book.controller.ts`、`book.service.ts`：顺着 HTTP 到持久化调用链阅读。
6. `entities/book.entity.ts`、`dto/`：补齐表结构和请求数据形状。
7. `public/index.html`：观察前端如何发起 CRUD 请求。
8. `docker-compose.prod.yml`：最后理解 Nest 镜像和 MySQL 服务如何组合。

## 本次整理内容

- 用学习包 README 替换 Nest CLI 默认模板，补齐文章主线、文件对应关系、依赖分类、运行命令、常见错误和 fallback。
- 新增本文件，沉淀完整复习顺序、调整理由、验证边界和后续风险。
- 将含义不清的 `Dockerfile2` 更名为 `Dockerfile.single-stage`，与多阶段 `Dockerfile` 形成明确递进。
- 删除与 `docker-compose.prod.yml` 内容完全相同的 `docker-compose.prod copy.yml`，避免复习时误以为存在第三套环境。
- 为 Dockerfile、Compose、Nest 入口、根模块、Book 模块、Controller、Service、Entity 和 DTO 添加复习型注释。
- 新增 `check` 与两个 `docker:config:*` 脚本；移除 `docker:up` 中只适用于类 Unix shell 的前置环境变量写法，改用 Compose 文件已有的默认数据目录。
- 修复当前根 TypeScript 6 / TypeORM 类型下的静态兼容问题：移除无用 `baseUrl`、显式声明 `rootDir` 和 Node 类型、标记框架赋值字段，并去掉无需配置的旧 `connectorPackage` 选项。

## 为什么没有 `_shared/`

已检查模型初始化、环境变量读取、schema、examples、prompt block 和工具函数：本课没有模型、prompt 或编号示例，也没有跨示例复用代码。Nest 的 Module、Controller、Service、Entity、DTO 是框架职责分层，不是应抽到 `_shared/` 的重复片段。创建 `_shared/` 只会增加跳转成本，因此不创建空目录。

## 依赖与 fallback

- 无需 API Key：全部源码静态阅读、TypeScript 检查、Nest 构建和基础单元测试。
- 需要模型 API：无。
- 需要 Docker CLI：Compose `config` 解析、镜像构建和容器操作。
- 需要外部服务：Book CRUD 需要 MySQL；开发 Compose 还声明了 Milvus、etcd、MinIO。
- fallback：执行静态检查和构建，对比 Dockerfile，静态阅读 Compose，并沿 `controller → service → entity` 跟踪请求。fallback 不伪造数据库结果。

课程依赖由仓库根 pnpm workspace 统一管理；不要在 lesson 内安装或维护 `node_modules`。本课没有模型环境变量。`PORT`、`NODE_ENV` 和 `DOCKER_VOLUME_DIRECTORY` 的来源及默认行为已写入 README；若后续把数据库凭据改成环境变量，应统一放在仓库根 `.env`。

## 文章与代码对齐情况

- 已覆盖：单阶段 Dockerfile、多阶段 Dockerfile、本地基础设施 Compose、Nest + TypeORM 图书 CRUD、静态管理页、生产 Compose。
- 文章提到但业务未使用：开发 Compose 中的 Milvus 只是基础设施演示，没有 Nest 侧调用代码。
- 教学简化：`synchronize: true` 自动同步表结构；DTO 未做运行时校验；数据库凭据明文写入；镜像使用 `latest`；生产 Compose 暴露 MySQL 端口。
- 启动缺口：`depends_on` 不等待 MySQL 健康，Nest 没有连接重试或迁移流程，因此不能据配置推断生产启动稳定。

## 后续注意

如果把本课扩展为更接近生产的示例，优先处理配置外置、固定镜像版本、数据库 migration、健康检查与应用重试、非 root 数据库账号、DTO 校验和前端输出转义。以上都超出本文“认识 Docker/Compose 并串起 Nest CRUD”的学习主线，本次没有过度工程化实现。

## 交付自检记录

- 课程根 Markdown：只保留 `README.md` 和 `REVIEW_NOTES.md`。
- `_shared/`：不需要，未创建空目录。
- 编号示例互相 import：本课无编号示例，不存在。
- 重复内容：生产 Compose 重复副本已删除；未发现需要抽离的公共示例代码。
- 子课程 `node_modules`：不存在；没有在 lesson 内安装依赖，也没有新增依赖或修改根锁文件。
- TypeScript：`tsc -p tsconfig.build.json --noEmit --incremental false` 通过，检查不残留增量缓存。
- 构建：`nest build` 通过，`dist/public/index.html` 已按 `nest-cli.json` 复制。
- 单元测试：1 个测试套件、1 个测试通过；e2e 未执行，因为完整 AppModule 会连接 MySQL。
- ESLint：`src` 与 `test` 全部通过。
- `node --check`：课程没有 `src/**/*.mjs`；已对唯一的 `eslint.config.mjs` 执行并通过。
- JSON：`package.json` 与 `nest-cli.json` 解析通过。
- Compose：当前环境未安装 Docker CLI，无法执行 `docker compose config`；已做文本结构检查，未宣称运行验证。
- pnpm：首次 workspace 命令因根 `node_modules` 状态不一致而试图交互式重装并中止；为保护用户依赖，后续使用根目录现有 CLI 直接验证，没有执行安装。
