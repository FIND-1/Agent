/**
 * 控制 LangGraph 分支的结构化输出协议。
 * 这些 schema 被多个示例复用；集中维护可避免路由枚举和字段名逐渐不一致。
 */
import { z } from "zod";

export const RouteSchema = z.object({
  strategy: z.enum(["simple", "complex"]),
  reason: z.string(),
});

export const DecomposeSchema = z.object({
  subQuestions: z.array(z.string()).min(1).max(6),
  reason: z.string(),
});

export const NextStepSchema = z.object({
  nextAction: z.enum(["retrieve", "generate"]),
  reason: z.string(),
});

export const EvaluationSchema = z.object({
  enough: z.boolean(),
  missing: z.array(z.string()).max(6),
  reason: z.string(),
  webQuery: z.string().optional(),
});
