import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { AppTool } from './tool.types';

/**
 * 复习重点：
 * time_now 给模型提供服务端当前时间，是下半部分里解析“几分钟后”“明天几点”的基础工具。
 *
 * 原文分析结论：
 * 模型不能可靠知道当前服务器时间；创建 at 类型任务前，应先取当前时间再计算 ISO 触发点。
 *
 * 依赖条件：
 * 返回的是服务器时间，不一定等于用户所在时区显示的本地时间。
 */
@Injectable()
export class TimeNowToolService {
  readonly tool: AppTool;

  constructor() {
    this.tool = tool(
      () => {
        const now = new Date();
        return {
          iso: now.toISOString(),
          timestamp: now.getTime(),
        };
      },
      {
        name: 'time_now',
        description:
          '获取当前服务器时间，返回 ISO 字符串（iso）和毫秒级时间戳（timestamp）。',
      },
    );
  }
}
