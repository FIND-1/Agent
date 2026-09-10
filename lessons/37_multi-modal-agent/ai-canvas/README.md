# AI 画板：第 37 课综合应用

这是文章“前端直传 OSS + 多模态模型”的 Nest 实战。完整环境变量、学习顺序和验证边界见 [课程 README](../README.md)，文章差异和共享检查见 [REVIEW_NOTES](../REVIEW_NOTES.md)。

## 阅读入口

按 `src/main.ts → src/app.module.ts → src/ai/ai.module.ts → ai.controller.ts → dto/image.dto.ts → ai.service.ts → oss.service.ts → image-store.service.ts → public/index.html` 阅读。作为完整 Nest 应用，保留框架命名；位于编号示例 00–07 之后。

- `GET /ai/oss/upload-signature`：返回绑定 key 的 Post Policy，不是 STS AssumeRole。
- 浏览器向 OSS POST 原图；`POST /ai/image` 只提交 prompt 与可选 imageUrl。
- 服务端调用万相、转存生成图片到 OSS，最后保存内存记录。
- `GET /ai/image/list` / `DELETE /ai/image/:id` 管理内存列表；重启丢记录，删除记录不删 OSS。

## 安装与配置

只在仓库根安装，复用根 node_modules，不在本目录安装或创建软链接：

```bash
pnpm --filter agent-engineering-lab install --frozen-lockfile
```

ConfigModule 固定读取仓库根 `.env`，src 与 dist 定位一致。必填 `EMBEDDINGS_API_KEY`、`OSS_REGION`、`OSS_BUCKET`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`；可选 `DASHSCOPE_HTTP_BASE_URL`、`OSS_UPLOAD_PREFIX`、`OSS_PREFIX`、`PORT`，详见课程配置表。

Bucket CORS 需允许实际页面来源（默认端口对应 `http://localhost:3000`）、POST 和所需请求头。Nest CORS 不能代替 Bucket CORS。浏览器显示 200 但 fetch 失败时，不能确认上传成功。私有 Bucket 的结果预览还需要读取签名支持，当前列表返回普通 URL。

## 本地检查与启动

以下命令在本应用目录执行，使用根目录工具：

```bash
pnpm run build
pnpm run test -- --runInBand
```

构建入口是 `dist/main.js`。`tsconfig.build.json` 将增量缓存放在 `dist/tsconfig.build.tsbuildinfo`，随 Nest 的 deleteOutDir 清理，避免缺产物但旧缓存跳过输出。

启动须先由用户确认 PORT 可用；本轮未执行以下命令，也未接管已有服务：

```bash
pnpm run start
# 或构建后
pnpm run start:prod
```

`/ai/image` 返回 400 时查看 Network Response，区分 DTO 校验和模型错误。现有控制器单测只验证能实例化；E2E 仍是预期 Hello World 的脚手架断言，与当前静态首页不符，未作为业务验证。原有测试、构建、调试脚本保留；默认不执行监听型测试或 --fix lint。

模型或 OSS 不可用时，按上述调用链静态复习，不需要启动服务。生成会调用计费 API；选图时如果已填写 prompt，页面上传后会自动触发生成。无数据库持久化和用户隔离，保持教学用途。
