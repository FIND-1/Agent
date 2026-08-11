# 文章中的优化版：用多阶段构建隔离“编译所需内容”和“运行所需内容”。
# 相比 Dockerfile.single-stage，最终阶段不保留源码和 devDependencies；构建仍依赖网络与 npm 镜像源。

# 构建阶段：需要 devDependencies（含 @nestjs/cli、TypeScript）才能执行 nest build。
FROM node:24.15-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install
COPY . .
RUN npm run build

# 运行阶段：仅安装生产依赖并复制编译产物，减少最终镜像体积。
FROM node:24.15-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install --production
COPY --from=builder /app/dist ./dist

# EXPOSE 只是元数据，端口发布由 docker run -p 或 Compose ports 完成。
EXPOSE 3000
CMD ["node", "dist/main.js"]
