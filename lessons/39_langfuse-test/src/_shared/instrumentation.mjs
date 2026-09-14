/**
 * 共享基础设施：必须最先加载，启动 OpenTelemetry 并把 span 导出到 Langfuse。
 * 短脚本使用 immediate 导出；长驻服务可改成 batched。初始化和 flush 都依赖外部 Langfuse 配置。
 */
import "@lessons/shared/env-loader";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  // "immediate"：span 结束就尽快导出，适合短脚本；默认 "batched" 适合长驻服务
  exportMode: "immediate",
});

const sdk = new NodeSDK({
  spanProcessors: [langfuseSpanProcessor],
});
sdk.start();

export async function shutdownTracing() {
  await langfuseSpanProcessor.forceFlush();
  await sdk.shutdown();
}
