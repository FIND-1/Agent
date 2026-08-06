declare module '@lessons/shared/model' {
  import type { ChatOpenAI } from '@langchain/openai';

  export function createChatModel(
    options?: Record<string, unknown>,
    temperature?: number,
  ): ChatOpenAI;
}
