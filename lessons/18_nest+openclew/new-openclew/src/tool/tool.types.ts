import type {
  StructuredToolCallInput,
  StructuredToolInterface,
} from '@langchain/core/tools';

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
