import { ChatOpenAI } from '@langchain/openai';
import { type AppTool } from '../tool/tool.types';
export declare class AiService {
    private readonly queryUserTool;
    private readonly sendMailTool;
    private readonly webSearchTool;
    private readonly dbUsersCrudTool;
    private readonly timeNowTool;
    private readonly cronJobTool;
    private readonly modelWithTools;
    constructor(model: ChatOpenAI, queryUserTool: AppTool, sendMailTool: AppTool, webSearchTool: AppTool, dbUsersCrudTool: AppTool, timeNowTool: AppTool, cronJobTool: AppTool);
    runChain(query: string): Promise<string>;
    runChainStream(query: string): AsyncIterable<string>;
}
