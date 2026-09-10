# Nest 进阶复习记录

## 材料与整理边界

2026-09-10：桌面 SUMMARY_RULES.txt 正文是 Nest 进阶文章，不是执行指令。整理规范来自仓库 AGENTS.md 和 SUMMARY_RULES.md。当前课程含对应源码，且目标为后续复习，满足触发条件。

真实课程根为 nest-feature：已有 package.json、src 和 Nest 配置。它是完整应用，按规则保留框架命名，不编号、不复制实现；没有额外独立示例脚本。本课没有编号示例文件，因此复习顺序以 Nest 模块依赖关系、请求调用链和运行依赖为主线。

## 文章主线与内部阅读顺序

1. **问题起点：后端 Agent 需要工程结构。** Nest 默认采用 Express adapter，也可使用其他 adapter。文章强调模块化、DI 与切面机制；“Express 不能维护企业项目”是过度概括，Express 也可通过架构和生态组织大型系统。
2. **IoC/DI。** main.ts 创建应用 → app.module.ts 声明模块/providers → app.controller.ts 注入 app.service.ts。Injectable 提供元数据，但类通常还需注册；Inject(token) 可使用自定义 token，不是按变量名自动找对象。
3. **取参与 Pipe。** user.module → user.controller → user.service → dto、entities。Body 读 JSON，Param 读路径，Query 读查询串；age-demo 在动态 :id 路由前声明。两支 Pipe 展示转换与拒绝非法输入。
4. **Guard 与自定义参数装饰器。** auth.module → auth.service → auth.guard → current-user.decorator。模拟 Token 查用户，Guard 写 request.user 并检查目标 ID；CurrentUser 只读取结果。
5. **环绕与异常出口。** transform.interceptor → all-exceptions.filter → api-response.interface，回到 app.module 看 APP_INTERCEPTOR/APP_FILTER 如何启用。没有注册时文件存在也不影响响应。
6. **真实 JWT。** 原文点名的 jwt-test.module.ts、jwt-test.service.ts、jwt-test.controller.ts 均保留在 src/jwt-test/。推荐先读 module 配置，再读 controller 的请求入口，最后读 service 的 sign/verify。
7. **验证。** 看本文请求示例及测试，区分预期、静态通过和实际 HTTP 运行验证。

## 一次请求怎么走

成功的 GET /user/2：

```text
main.ts 中间件（开始）
→ AuthGuard：解析固定 Token、认证/授权、写 request.user
→ TransformInterceptor（前置日志）
→ ParsePositiveIntPipe / CurrentUser 参数解析
→ UserController.findOne → UserService.findOne
→ TransformInterceptor：map 封装 + tap 成功日志
→ HTTP 响应 → 中间件 finish 日志
```

Pipe/Service 抛异常时不执行成功 map/tap；未捕获异常交给全局 Filter。Guard 拒绝发生在拦截器进入之前，也由 Filter 格式化错误。Filter 不是每个成功请求都经过的一步。中间件 finish 日志覆盖更广，保留现有实现观察差异；没有为了几行日志另建 utils。

## 文章与代码的差异、教学边界

| 项目 | 对照结果 |
| --- | --- |
| Guard 状态码 | 文章笼统写 403；实际缺失/无效 Token 为 401，已认证但无权限为 403 |
| JWT 签发 | 原文 curl 写 200；Nest Post 默认 HTTP 201，本课没有 HttpCode 覆盖 |
| AOP 启用 | 整理前 Filter/Interceptor 只有定义；本次用 APP_* 全局注册，连通文章的响应治理示例 |
| 响应变化 | 原先根路由是裸字符串、签发是 { access_token }；现在均包在 data，包括 data.access_token。同步调整 E2E 预期与请求说明 |
| 全局范围 | 用户、JWT 和根路由成功响应均被封装；HTTP 错误由 Filter 返回 { code: HTTP状态码, data: null, message } |
| 两种认证 | 文章说“换成真实 jwt”，代码实为并列演示；没有擅自把 JwtService 接到用户 Guard |
| JWT 边界 | 固定密钥仅教学；公开 sign 接口无身份核验或运行时载荷校验。verify 校验签名/有效期，泛型不验证业务字段 |
| DTO/实体 | CreateUserDto、PartialType、User 类不是输入校验或持久化。无 ValidationPipe；update 的 Object.assign 无字段白名单 |
| ID/年龄 | 正整数 Pipe 拒绝 01/1abc/1.0，但未保证安全整数；年龄允许小数及部分特殊数字写法，不是严格整数校验 |
| 认证顺序 | Guard 早于 Pipe，普通用户访问非法 ID 可能先 403；检查 ID 的 400 可用无 Guard 的 DELETE /user/abc 或管理员 Token |
| 内存 CRUD | 无数据库；重启清空修改，删除初始用户后后续预期会变化。持久化仅为将来 TODO |

## 本次修改与路径映射

- 用课程 README 替换 Nest 模板，补充依赖分类、命令、环境变量和不启动服务的复习路径。
- 所有核心实现增加复习注释，保留已有签发/校验、Pipe、Guard、教学密钥和中间件注释。只增加解释、统一格式，没有静默删除源码注释。
- 补齐全局 Filter/Interceptor 注册，保留现有业务路由和模拟认证。
- tsconfig.json 增加 rootDir 为当前目录，解决 TypeScript 6 下 ts-jest 的 TS5011；构建配置仍以 src 为 rootDir，保持 dist/main.js 布局。
- UserController 单测导入 AuthModule，保证守卫依赖可解析。E2E 根响应预期更新，但本轮不运行涉及监听的 E2E。
- 未修改根依赖、真实密钥、其他课程及原有用户改动；不安装依赖、不生成压缩包。

| 原路径 | 整理后位置 | 原因 |
| --- | --- | --- |
| curl-test.md | 本文“模拟 Token 与 Pipe 请求” | 合并配套资料，课程根仅保留两份 Markdown |
| curl-test2.md（文章点名） | 本文“真实 JWT 请求” | 保留示例及 PowerShell 引号说明，修正响应取值路径 |
| src、test 和应用配置 | 原路径保留 | 完整 Nest 应用例外，不是独立编号脚本；无编号重命名映射 |

## 共享与跨课程重复检查

已检索 lessons 的 Bearer 提取、JwtService/JwtModule、两种 Pipe、响应拦截器/过滤器和 PORT 读取，并检查 lessons/_shared 现有入口。

- Bearer 解析有两个实际使用文件：auth.guard.ts 与原文点名的 jwt-test.controller.ts。保留两段短解析维持“模拟 → 真实”阅读闭环，不抽空原文控制器，未超过 3 个使用文件。
- Pipe、模拟 Token 校验和 JWT 初始化在本课各有单一实现；未发现相同实现形成跨课共享能力。其他课的 ParseIntPipe 是框架调用，不是本课正整数回比规则的副本。
- 多个 Nest main.ts 使用 process.env.PORT，这是入口一行配置，不是值得抽离的环境加载器；本课不加载 .env，无重复模型初始化、prompt、examples 或模型 schema。
- ApiResponse 消费者复用同一接口。模拟 JwtPayload 与真实 JwtTestPayload 字段含义不同，不能只因名称相似合并。
- 已有 common 承担应用内 AOP；保持框架结构，不新建空 _shared，也不把依赖本课认证/响应契约的组件移入跨课共享。本轮没有触发“值得抽离且超过 3 个使用文件”的迁移条件。

## 依赖与降级复习

所有源码无需 API Key、模型 API 或外部服务。复用根 Nest、JWT、RxJS、TypeScript、Jest、ESLint 依赖；根 package 和锁文件原本已有所需依赖，本轮无需改动。仅 PORT 可选，由启动环境注入，根 .env 不会自动加载。无独立 node_modules，无新环境文件。

不能启动 HTTP 服务时，按 README 顺序读注册与调用链，执行静态检查和单测即可。没有新增 fallback。数据库接入必须先提供外部环境，不能把数组 CRUD 当数据库验证。

## 模拟 Token 与 Pipe 请求

以下是手动执行的预期，不是本轮 HTTP 验证结果。先由用户确认并启动服务；默认地址 localhost:3000，修改 PORT 后同步改 URL。AppModule 导入 AuthModule、UserModule；固定 Token 不是真实 JWT。需初始用户 1、2 尚未删除。

```powershell
# 1. 无 Token → 401
curl.exe http://localhost:3000/user/2
# 2. 普通用户查自己 → 200
curl.exe -H 'Authorization: Bearer user-token-456' http://localhost:3000/user/2
# 3. 普通用户查他人 → 403
curl.exe -H 'Authorization: Bearer user-token-456' http://localhost:3000/user/1
# 4. 管理员查任意用户 → 200
curl.exe -H 'Authorization: Bearer admin-token-123' http://localhost:3000/user/2
# 5. age 转数字 → 200，data 为 { age: 25, type: 'number' }
curl.exe 'http://localhost:3000/user/age-demo?age=25'
# 6. 非法 ID → 400，DELETE 无 Guard，Pipe 拒绝，不会删除数据
curl.exe -X DELETE http://localhost:3000/user/abc
# 7. 用户不存在 → 404
curl.exe -H 'Authorization: Bearer admin-token-123' http://localhost:3000/user/999
```

## 真实 JWT 请求

AppModule 导入 JwtTestModule；固定教学密钥，有效期一小时，与用户模拟 Token 独立。

```powershell
# 1. 签发 → HTTP 201（原文 200 的更正），从 data.access_token 复制 token
'{"sub": 1, "username": "testuser"}' | curl.exe -X POST -H 'Content-Type: application/json' --data-binary '@-' http://localhost:3000/jwt-test/sign
# 2. 校验 → 200，data 包含 sub、username 和 JWT 时间字段
curl.exe -H 'Authorization: Bearer <token>' http://localhost:3000/jwt-test/verify
# 3. 未携带 Token → 401
curl.exe http://localhost:3000/jwt-test/verify
# 4. 无效 Token → 401
curl.exe -H 'Authorization: Bearer invalid-token' http://localhost:3000/jwt-test/verify
```

通过管道将 JSON 传入标准输入，--data-binary '@-' 让 curl 读取，避免 Windows PowerShell 5.1 / Legacy 模式丢失原生参数中的 JSON 双引号。示例使用 ASCII 内容，不直接换回 -d '{...}'。

## 交付自检

以下为本轮检查结果。curl 状态是源码推导的预期，不代表实际接口测试通过。

- TypeScript：tsc --noEmit --incremental false 通过。
- ESLint：src/test 全量检查通过，无错误或警告。
- Nest build：通过，保持 dist/main.js 输出布局。
- Jest：现有 3 个测试套件、3 个测试通过；仅验证基础实例与直接方法调用，不等于 AOP/JWT 的 HTTP 集成测试已通过。
- node --check eslint.config.mjs 通过；src 无 mjs，带装饰器的 TypeScript 已由 tsc 检查。
- 未启动任何服务、未运行 curl/E2E，未操作已有进程或端口。
- 课程根 Markdown 仅 README.md、REVIEW_NOTES.md。两份 curl 资料已合并，旧文件名仅留在原文映射。
- 本课程不存在 node_modules；使用根依赖，没有安装或升级依赖。package.json 和依赖分组说明齐全，PORT 的环境来源已说明。
- 无空 _shared，无编号示例互相 import。完整应用保留框架命名，无独立脚本待编号，编号连续性/宽度不适用。
- 无新增 fallback；已有不启动服务的降级复习路径。原有源码注释保留，错误结论在笔记和相邻注释中补充说明。

### 按名称升序的交付文件清单

以下由实际文件枚举生成，排除生成物 dist、tsbuildinfo 和依赖目录。字母排序用于结构核对，内部学习顺序以上文模块调用链为准。

```text
.gitignore
.prettierrc
eslint.config.mjs
nest-cli.json
package.json
README.md
REVIEW_NOTES.md
src/app.controller.spec.ts
src/app.controller.ts
src/app.module.ts
src/app.service.ts
src/auth/auth.module.ts
src/auth/auth.service.ts
src/common/decorators/current-user.decorator.ts
src/common/filters/all-exceptions.filter.ts
src/common/guards/auth.guard.ts
src/common/interceptors/transform.interceptor.ts
src/common/interfaces/api-response.interface.ts
src/common/pipes/parse-age.pipe.ts
src/common/pipes/parse-positive-int.pipe.ts
src/jwt-test/jwt-test.controller.ts
src/jwt-test/jwt-test.module.ts
src/jwt-test/jwt-test.service.ts
src/main.ts
src/user/dto/create-user.dto.ts
src/user/dto/update-user.dto.ts
src/user/entities/user.entity.ts
src/user/user.controller.spec.ts
src/user/user.controller.ts
src/user/user.module.ts
src/user/user.service.spec.ts
src/user/user.service.ts
test/app.e2e-spec.ts
test/jest-e2e.json
tsconfig.build.json
tsconfig.json
```
