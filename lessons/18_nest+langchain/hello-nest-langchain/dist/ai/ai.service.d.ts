import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
export declare class AiService {
    private readonly model;
    private readonly configService;
    private readonly chain;
    constructor(model: ChatOpenAI, configService: ConfigService);
    runChain(query: string): Promise<string>;
    streamChain(query: string): AsyncGenerator<string>;
    private validateRequest;
}
