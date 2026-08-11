# Nest + Dockerfile + Docker Compose 学习包

> 外部前置条件：本课依赖 Docker、MySQL，并在开发编排中包含 Milvus。当前仓库不提供或托管这些服务，本次只完成源码整理、构建/类型检查与配置静态检查；没有验证容器启动、建库建表、CRUD、curl 或生产部署。

## 这篇文章想教会什么

业务代码负责调度数据基础设施：MySQL 保存不可丢失的原始业务数据，Redis、Elasticsearch、Milvus、消息队列等中间件提供缓存、检索或异步处理等专项能力。Docker 把应用及依赖封装成镜像，Compose 再把多个容器的参数、网络和依赖关系统一编排起来。

本课用一个 Nest 图书 CRUD 把这条主线串起来：

1. 用 `Dockerfile.single-stage` 理解基础镜像、工作目录、复制、构建和启动指令。
2. 用 `Dockerfile` 学习多阶段构建，只把生产依赖和 `dist` 放入最终镜像。
3. 用 `docker-compose.dev.yml` 统一描述本地开发所需的 MySQL、Milvus、etcd 和 MinIO。
4. 用 `src/` 理解 Nest 如何通过 TypeORM 操作 MySQL，并用静态页调用 CRUD API。
5. 用 `docker-compose.prod.yml` 理解 Nest 与 MySQL 如何借助 Compose 网络按服务名通信。

## 推荐复习顺序

本课是单个 Nest 应用，没有编号示例文件。建议按容器递进和请求调用链复习：

| 顺序 | 文件 | 学习目的 | 外部依赖 |
| --- | --- | --- | --- |
| 1 | `Dockerfile.single-stage` | 认识六类核心 Dockerfile 指令及单阶段镜像的体积问题 | Docker（仅阅读不需要） |
| 2 | `Dockerfile` | 对比 builder/runner 两阶段如何缩小最终镜像 | Docker（仅阅读不需要） |
| 3 | `docker-compose.dev.yml` | 理解端口、环境变量、数据卷、健康检查和服务依赖 | Docker、MySQL、Milvus |
| 4 | `src/main.ts` → `src/app.module.ts` | 理解应用入口、静态资源、TypeORM 和环境差异 | 构建不需要；运行需要 MySQL |
| 5 | `src/book/book.module.ts` → `book.controller.ts` → `book.service.ts` | 沿 HTTP → Service → EntityManager 跟踪 CRUD | 运行需要 MySQL |
| 6 | `src/book/entities/book.entity.ts` 与 `dto/` | 理解表映射、创建参数和部分更新 | 运行需要 MySQL |
| 7 | `public/index.html` | 查看浏览器端如何调用 `/book` API | 运行需要 Nest + MySQL |
| 8 | `docker-compose.prod.yml` | 理解镜像构建、服务名通信和生产组合 | Docker、MySQL |

## 关键结论

- 镜像是不可变的应用模板，容器是镜像的运行实例。
- `EXPOSE 3000` 只声明端口；`-p 3006:3000` 或 Compose `ports` 才会发布端口。
- 数据卷把 MySQL 等服务的数据放到容器生命周期之外；删容器不等于删持久化数据。
- 多阶段构建把编译工具留在 builder，只把生产依赖和 `dist` 复制到运行阶段。
- Compose 服务默认位于同一网络。宿主机上的 Nest 使用 `localhost`，容器内的 Nest 使用 `mysql-prod` 服务名。
- `depends_on` 只表达启动顺序，不保证 MySQL 已可接受连接；真实部署需要健康检查、重试或迁移策略。
- TypeORM `synchronize: true`、`root/admin` 和 `mysql:latest` 都是教学简化，不是生产实践。
- 当前 `Book` DTO 只有 TypeScript 类型，没有运行时参数校验。

## 依赖强度与运行方式

课程是 pnpm workspace 成员，依赖统一从仓库根目录维护和复用；不要在本课程目录单独执行 `pnpm install`。

### 1. 无需 API Key、Docker 或数据库

在仓库根目录执行静态检查：

```bash
pnpm --filter nest-dockerfile-test run check
pnpm --filter nest-dockerfile-test run build
pnpm --filter nest-dockerfile-test run test -- --runInBand
```

`test` 这里只覆盖不连接数据库的基础单元测试。不要把构建或单元测试通过理解为数据库链路已经验证。

### 2. 需要模型 API

无。本课不调用任何模型，也不需要 API Key 或根目录 `.env` 中的模型变量。

### 3. 需要 Docker CLI，但不启动容器

以下命令只解析 Compose 配置；仍要求本机安装 Docker CLI：

```bash
pnpm --filter nest-dockerfile-test run docker:config:dev
pnpm --filter nest-dockerfile-test run docker:config:prod
```

### 4. 需要 Docker / MySQL / Milvus 的外部运行路径（TODO）

以下是文章原有操作路径，当前仓库未执行验证：

```bash
# 开发基础设施：会占用 3306、9000、9001、19530、9091 等端口
pnpm --filter nest-dockerfile-test run docker:up

# 多阶段镜像（只构建，不代表数据库可用）
docker build -t nest-app lessons/25_nest-dockerfile-test

# 教学生产组合：会构建 Nest 并启动 MySQL，占用 3000、3306
pnpm --filter nest-dockerfile-test run docker:prod:up
```

这些命令会创建容器和 `volumes/` 数据目录。只有在你明确准备好 Docker 环境、端口和数据目录后再执行；关闭开发依赖可使用 `docker:down`，但数据卷目录不会自动删除。

容器成功启动后，文章使用 `/book` CRUD 和 `/books` 静态页面做联调。它们依赖真实 MySQL，当前均为待验证项。

### 5. fallback 复习路径

没有 Docker 或 MySQL 时，仍可完整复习核心结构：

1. 运行 `check` 和 `build`，确认 TypeScript、Nest 编译及静态资源复制配置成立。
2. 对比两个 Dockerfile，重点观察最终阶段是否只保留 `package*.json`、生产依赖和 `dist`。
3. 使用文本阅读 Compose 的 `ports`、`environment`、`volumes`、`depends_on` 与默认网络。
4. 沿 `controller → service → entity` 静态跟踪一次创建和更新流程。

此 fallback 不模拟数据库，也不能证明 SQL、自动建表、CRUD 或容器网络可用。

## 配置说明

- `PORT`：Nest 监听端口，默认 `3000`。
- `NODE_ENV=production`：让 `app.module.ts` 把数据库主机切换为 Compose 服务名 `mysql-prod`。
- `DOCKER_VOLUME_DIRECTORY`：可在运行 Compose 前由 shell 设置，控制数据卷宿主机根目录；未设置时使用课程目录下的 `volumes/`。
- MySQL 用户名、密码和数据库名目前按文章写死为 `root/admin/book`，仅用于教学。项目没有为本课新增 `.env`；若以后改为环境变量，统一维护仓库根目录 `.env`，并同步修改 Compose。

## 常见问题

- `Cannot connect to the Docker daemon`：Docker 未安装或 daemon 未启动；改走 fallback。
- pnpm 提示清理或重装根 `node_modules`：不要在 lesson 内单独安装；回到仓库根目录同步 workspace 依赖后再运行。本次为避免改动用户依赖，使用根目录现有 CLI 完成了静态验证。
- `port is already allocated`：Compose 配置中的宿主机端口已被占用；不要停止未知进程，先由你决定改端口或释放端口。
- `ECONNREFUSED 127.0.0.1:3306`：宿主机开发路径没有可用 MySQL。
- `getaddrinfo ENOTFOUND mysql-prod`：在 Compose 网络外却使用了容器服务名。
- 应用早于 MySQL 就绪而退出：`depends_on` 不提供数据库就绪保证，需要健康检查/重试；本课未实现。
- 页面可打开但 CRUD 失败：静态资源服务不代表数据库连接成功。

## 一周后怎么复习

先用 10 分钟对比两个 Dockerfile，再用 10 分钟画出 `浏览器 → Controller → Service → EntityManager → MySQL` 调用链，最后解释开发环境为何连接 `localhost`、生产容器为何连接 `mysql-prod`。能说清这三点，就掌握了本文主线。
