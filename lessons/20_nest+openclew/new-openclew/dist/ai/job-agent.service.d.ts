import { ChatOpenAI } from '@langchain/openai';
import { type AppTool } from '../tool/tool.types';
export declare class JobAgentService {
    private readonly sendMailTool;
    private readonly webSearchTool;
    private readonly dbUsersCrudTool;
    private readonly timeNowTool;
    private readonly logger;
    private readonly modelWithTools;
    constructor(model: ChatOpenAI, sendMailTool: AppTool, webSearchTool: AppTool, dbUsersCrudTool: AppTool, timeNowTool: AppTool);
    runJob(instruction: string): Promise<string>;
}
