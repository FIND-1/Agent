import type { StructuredToolInterface } from '@langchain/core/tools';
export type AppTool = StructuredToolInterface;
export declare function toToolMessageContent(value: unknown): string;
export declare function invokeAppTool(tool: AppTool, args: unknown): Promise<string>;
