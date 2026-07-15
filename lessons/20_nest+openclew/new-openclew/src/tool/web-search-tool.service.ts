import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AppTool } from './tool.types';

type WebSearchArgs = {
  query: string;
  count?: number;
};

type BochaWebPage = {
  name?: string;
  url?: string;
  summary?: string;
  siteName?: string;
  siteIcon?: string;
  dateLastCrawled?: string;
};

type BochaSearchResponse = {
  code?: number;
  msg?: string;
  data?: {
    webPages?: {
      value?: BochaWebPage[];
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBochaSearchResponse(value: unknown): value is BochaSearchResponse {
  return isRecord(value);
}

/**
 * 复习重点：
 * web_search 把外部搜索 API 封装成 tool，让 Agent 可以先查资料再回答或执行任务。
 *
 * 原文分析结论：
 * tool 内部要处理缺少密钥、HTTP 失败、JSON 解析失败和返回结构异常，避免把外部错误变成 agent loop 崩溃。
 *
 * 依赖条件：
 * 需要 BOCHA_API_KEY，并且运行环境可以访问博查搜索接口。
 */
@Injectable()
export class WebSearchToolService {
  readonly tool: AppTool;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  constructor() {
    const webSearchArgsSchema = z.object({
      query: z.string().min(1).describe('Search query'),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Number of search results'),
    });

    this.tool = tool(
      async ({ query, count }: WebSearchArgs) => {
        const apiKey = this.configService.get<string>('BOCHA_API_KEY');
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

        let json: unknown;
        try {
          json = (await response.json()) as unknown;
        } catch (error) {
          return `Search API response could not be parsed: ${(error as Error).message}`;
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
          .map(
            (page, index) =>
              `Result ${index + 1}
Title: ${page.name ?? ''}
URL: ${page.url ?? ''}
Summary: ${page.summary ?? ''}
Site: ${page.siteName ?? ''}
Icon: ${page.siteIcon ?? ''}
CrawledAt: ${page.dateLastCrawled ?? ''}`,
          )
          .join('\n\n');
      },
      {
        name: 'web_search',
        description: 'Search web pages with the Bocha Web Search API.',
        schema: webSearchArgsSchema,
      },
    );
  }
}
