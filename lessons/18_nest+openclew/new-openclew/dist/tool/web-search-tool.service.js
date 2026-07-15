"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchToolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isBochaSearchResponse(value) {
    return isRecord(value);
}
let WebSearchToolService = class WebSearchToolService {
    tool;
    configService;
    constructor() {
        const webSearchArgsSchema = zod_1.z.object({
            query: zod_1.z.string().min(1).describe('Search query'),
            count: zod_1.z
                .number()
                .int()
                .min(1)
                .max(20)
                .optional()
                .describe('Number of search results'),
        });
        this.tool = (0, tools_1.tool)(async ({ query, count }) => {
            const apiKey = this.configService.get('BOCHA_API_KEY');
            if (!apiKey) {
                return 'Bocha Web Search API key is not configured.';
            }
            const response = await fetch('https://api.bochaai.com/v1/web-search', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    freshness: 'noLimit',
                    summary: true,
                    count: count ?? 10,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                return `Search API request failed: status=${response.status}, body=${errorText}`;
            }
            let json;
            try {
                json = (await response.json());
            }
            catch (error) {
                return `Search API response could not be parsed: ${error.message}`;
            }
            if (!isBochaSearchResponse(json)) {
                return 'Search API response shape is invalid.';
            }
            if (json.code !== 200 || !json.data) {
                return `Search API request failed: ${json.msg ?? 'unknown error'}`;
            }
            const webpages = json.data.webPages?.value ?? [];
            if (!webpages.length) {
                return 'No search results found.';
            }
            return webpages
                .map((page, index) => `Result ${index + 1}
Title: ${page.name ?? ''}
URL: ${page.url ?? ''}
Summary: ${page.summary ?? ''}
Site: ${page.siteName ?? ''}
Icon: ${page.siteIcon ?? ''}
CrawledAt: ${page.dateLastCrawled ?? ''}`)
                .join('\n\n');
        }, {
            name: 'web_search',
            description: 'Search web pages with the Bocha Web Search API.',
            schema: webSearchArgsSchema,
        });
    }
};
exports.WebSearchToolService = WebSearchToolService;
__decorate([
    (0, common_1.Inject)(config_1.ConfigService),
    __metadata("design:type", config_1.ConfigService)
], WebSearchToolService.prototype, "configService", void 0);
exports.WebSearchToolService = WebSearchToolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WebSearchToolService);
//# sourceMappingURL=web-search-tool.service.js.map