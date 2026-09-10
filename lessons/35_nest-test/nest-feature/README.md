# 35 · Nest 进阶：DI、AOP 与 JWT

对应附件《Nest 进阶：企业级 Node.js 后端最主流框架》。目标是沿一次请求理解模块依赖注入、参数转换、权限判断、响应转换与异常处理，再从模拟 Token 过渡到真实 JWT。

本课是完整 Nest 应用，真实课程根为 `lessons/35_nest-test/nest-feature/`。按仓库独立应用例外保留框架文件名，不给模块文件编号，也不复制编号入口。没有独立教学脚本需要编号；下表是阅读顺序，不是分别运行各文件。

这里的“完整应用”仅指 Nest 的代码结构；Git 统一归属仓库根 `agent`，本目录不是独立 Git 仓库或 submodule。

## 复习路线与文章映射

| 顺序 | 文件（相对于本目录） | 学习目的 | 主要边界/常见问题 |
| --- | --- | --- | --- |
| 00 | `src/main.ts`、`src/app.module.ts` | 启动容器，注册模块和全局 AOP | 启动入口会监听端口 |
| 01 | `src/app.controller.ts` → `src/app.service.ts` | Controller 构造器注入 Service | Injectable 还需配合 providers |
| 02 | `src/user/user.module.ts` → `user.controller.ts` → `user.service.ts`、`dto/`、`entities/` | 取参、内存 CRUD、DTO | 无数据库；DTO 类型不是运行时验证 |
| 02 | `src/common/pipes/parse-age.pipe.ts`、`parse-positive-int.pipe.ts` | Query 转数字、Param 转正整数 | 非法参数 400；age 允许小数 |
| 03 | `src/auth/auth.module.ts` → `auth.service.ts`、`src/common/guards/auth.guard.ts`、`decorators/current-user.decorator.ts` | 模拟认证、授权、读取当前用户 | 无效 Token 401；无权限 403 |
| 04 | `src/common/interceptors/transform.interceptor.ts`、`filters/all-exceptions.filter.ts`、`interfaces/api-response.interface.ts` | 成功响应封装、统一异常格式 | 通过 AppModule 的 APP_* 全局启用 |
| 05 | `src/jwt-test/jwt-test.module.ts` → `jwt-test.controller.ts` → `jwt-test.service.ts` | 签发、携带、验证真实 JWT | 教学密钥；签发接口不验证身份 |
| 06 | [REVIEW_NOTES.md](./REVIEW_NOTES.md) 的请求示例、`src/**/*.spec.ts`、`test/app.e2e-spec.ts` | 对照预期与验证边界 | curl/E2E 本轮未执行 |

上述源码全部无需 API Key、无需外部服务；统一启动应用后访问对应路由，不能用 node 分别运行 Nest 模块。

## 按依赖强度运行

### 1. 静态检查与不监听端口的单测

依赖统一由仓库根 `package.json`、`pnpm-lock.yaml` 管理，复用根 `node_modules`。需要安装时只在仓库根执行 `pnpm install`，不要在本目录安装。使用仓库要求的 Node.js 22+ 和 pnpm；本课不是脱离仓库即可独立安装的压缩包。

从仓库根进入应用后执行（显式使用根依赖）：

```powershell
cd lessons/35_nest-test/nest-feature
node ../../../node_modules/typescript/bin/tsc --noEmit --incremental false
node ../../../node_modules/eslint/bin/eslint.js "{src,test}/**/*.ts"
node ../../../node_modules/jest/bin/jest.js --runInBand
node ../../../node_modules/@nestjs/cli/bin/nest.js build
node --check eslint.config.mjs
```

`src/` 是带装饰器的 TypeScript，没有 `.mjs` 示例，用 tsc 检查而非 `node --check src/**/*.mjs`。已有 lint 脚本带 `--fix`，只读验收用上面的命令。

### 2. 无需 API Key 的手动运行

本轮未启动服务、未占用端口。用户确认端口可用后，可在本应用目录手动执行：

```powershell
# 默认 3000；如已被占用，先选定空闲端口并设置 $env:PORT
node ../../../node_modules/@nestjs/cli/bin/nest.js start
```

`PORT` 是唯一读取的环境变量，可选，默认 3000。本课未加载 dotenv/ConfigModule，因此根 `.env` 中的值不会自动生效；项目统一在仓库根 `.env` 管理环境配置，需要时由启动环境注入，或显式设置 PowerShell 的 `$env:PORT`。不要新增课内 `.env`。

启动后按 REVIEW_NOTES 先跑模拟 Token/参数示例，再跑 JWT 示例。全局拦截器将成功响应封装为 `{ code: 200, data, message: '成功' }`，签发结果位于 **`data.access_token`**。POST 默认 HTTP 201，与响应体 code 的 200 是两个概念。

### 3. 模型 API / 外部服务

无模型 API、数据库、Docker、Redis 或远程服务依赖。UserService 的数组重启即重置，不代表数据库 CRUD 已验证；将来接数据库属于外部前置条件 / TODO。JWT 使用现有固定教学密钥，无需填写真实密钥。

### 4. 服务不可运行时的最小复习路径

不必启动服务：读 app.module 的注册，沿 GET /user/:id 追踪 Guard → Pipe → CurrentUser → Service → Interceptor；再读 Filter 的异常出口。最后读 JWT sign/verify 并运行静态检查和单测。不新增 fallback 示例。

## 关键结论与常见问题

- DI 按 token（通常是 class，也可显式字符串/符号）解析依赖，不是按构造参数变量名匹配。IoC 是更广的设计思想，DI 是实现方式之一。
- AOP 集中管理横向职责；定义组件后还必须注册或挂到路由，才能生效。
- Guard 先于 Pipe；不带 Token 的非法用户 ID 请求可能先返回 401，而不是 400。
- `/user` 只在 GET/PATCH `:id` 校验模拟 Token；真实 JWT 不能直接用来访问它。其他用户路由公开，不能当成完整权限系统。
- 成功请求出现两组日志是中间件与拦截器并存；Guard 拒绝时不会进入拦截器。
- EADDRINUSE：端口被占用，先确认用户服务，不自动停止或接管。
- Cannot find module：检查根依赖是否已安装，不在课内另装一份。
- 404 可能来自用户不存在或路由写错；内存修改会影响后续请求预期。
- JWT 401：确认读取 data.access_token，使用 Bearer Token，且 token 未过期。

下次复习先口述请求执行顺序，再对照 [完整复习笔记](./REVIEW_NOTES.md) 中的文章差异与自检记录。
