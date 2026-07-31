import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatOpenAI } from '@langchain/openai';
export declare class AiService {
    private readonly eventEmitter;
    private readonly chain;
    constructor(model: ChatOpenAI, eventEmitter: EventEmitter2);
    streamChain(query: string, sessionId?: string): AsyncGenerator<string>;
}
