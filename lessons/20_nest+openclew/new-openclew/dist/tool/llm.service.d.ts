import { ChatOpenAI } from '@langchain/openai';
export declare class LlmService {
    private readonly configService;
    getModel(): ChatOpenAI;
}
