import type {
  StructuredToolCallInput,
  StructuredToolInterface,
} from '@langchain/core/tools';

/**
 * 复习重点：
 * 这里是本项目对 LangChain tool 的轻量适配层，统一工具类型和返回值格式。
 *
 * 原文分析结论：
 * Agent loop 只需要把 tool 执行结果塞回 ToolMessage，所以不同工具的返回值要先规范成字符串。
 *
 * 依赖条件：
 * invokeAppTool 假设传入对象符合具体 tool 的 schema，参数校验由 LangChain tool 和 zod schema 负责。
 */
export type AppTool = StructuredToolInterface;

export function toToolMessageContent(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '';
  }

  return JSON.stringify(value);
}

export async function invokeAppTool(
  tool: AppTool,
  args: unknown,
): Promise<string> {
  const result: unknown = (await tool.invoke(
    args as StructuredToolCallInput,
  )) as unknown;
  return toToolMessageContent(result);
}
