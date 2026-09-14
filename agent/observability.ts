import "dotenv/config";

import { Langfuse } from "langfuse";
import type {
  LangfuseSpanClient,
  LangfuseTraceClient,
} from "langfuse";

const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
const secretKey = process.env.LANGFUSE_SECRET_KEY;
const baseUrl = process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST;

/**
 * Langfuse is optional so the root demo remains useful without credentials.
 * The SDK is only constructed when both project keys are present.
 */
export const langfuse =
  publicKey && secretKey
    ? new Langfuse({
        publicKey,
        secretKey,
        ...(baseUrl ? { baseUrl } : {}),
        release: process.env.LANGFUSE_RELEASE ?? "agent-engineering-lab",
        environment: process.env.LANGFUSE_ENVIRONMENT ?? "development",
      })
    : undefined;

export type TraceContext = {
  trace?: LangfuseTraceClient;
  flush: () => Promise<void>;
};

/** Keep common credentials out of trace input while retaining useful context. */
export function redactSensitiveText(value: string): string {
  return value
    .replace(/(bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(
      /((?:api[_-]?key|access[_-]?token|secret|password|token)\s*[:=]\s*)[^\s,;]+/gi,
      "$1[REDACTED]",
    );
}

export function startTrace(task: string): TraceContext {
  if (!langfuse) {
    return { flush: async () => undefined };
  }

  const trace = langfuse.trace({
    name: "agent-run",
    input: { task: redactSensitiveText(task) },
    metadata: { runner: "agent/runner.ts" },
    tags: ["agent-engineering-lab", "root-runner"],
  });

  return {
    trace,
    flush: () => langfuse.flushAsync(),
  };
}

export function finishTrace(
  context: TraceContext,
  output: unknown,
  error?: unknown,
): void {
  if (!context.trace) return;

  context.trace.update({
    output,
    ...(error
      ? {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      : {}),
  });
}

export function startSpan(
  context: TraceContext,
  name: string,
  input: unknown,
): LangfuseSpanClient | undefined {
  return context.trace?.span({ name, input });
}
