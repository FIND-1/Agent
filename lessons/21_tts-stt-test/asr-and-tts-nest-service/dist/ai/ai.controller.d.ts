import { type Observable } from 'rxjs';
import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chatStream(query?: string, sessionId?: string): Observable<{
        data: string;
    }>;
}
