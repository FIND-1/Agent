import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(query: string): Promise<{
        answer: string;
    }>;
    chatStream(query: string): Observable<MessageEvent>;
}
