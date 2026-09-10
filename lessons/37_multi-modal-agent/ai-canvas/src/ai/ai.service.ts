// 综合 04 文生图与 05 图像编辑：按 imageUrl 分流，临时结果转存 OSS 后才记入列表。
// 依赖 DashScope 和 OSS；内存列表不等于数据库持久化，转存失败也不会回滚模型调用。
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Configuration,
  GenerationResult,
  MultiModalConversation,
} from 'dashscope-sdk-official';
import { ImageDto } from './dto/image.dto';
import { ImageRecord } from './image-record.interface';
import { ImageStoreService } from './image-store.service';
import { OssService } from './oss.service';

interface WanImageOptions {
  size?: string;
  promptExtend: boolean;
  watermark: boolean;
}

interface MultiModalConversationInternal {
  syncRequest(data: Record<string, unknown>): Promise<GenerationResult>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: MultiModalConversation;

  constructor(
    private readonly config: ConfigService,
    private readonly ossService: OssService,
    private readonly imageStore: ImageStoreService,
  ) {
    this.client = new MultiModalConversation(
      new Configuration({
        // 与 wan 示例一致，复用根 .env 中 DashScope 的 Key。
        apiKey: this.config.getOrThrow<string>('EMBEDDINGS_API_KEY').trim(),
      }),
    );
  }

  async createImage(dto: ImageDto): Promise<ImageRecord> {
    const options: WanImageOptions = {
      size: dto.size,
      promptExtend: dto.promptExtend ?? true,
      watermark: dto.watermark ?? false,
    };
    const inputImageUrl = dto.imageUrl;
    const resultUrl = inputImageUrl
      ? await this.generateByEdit(
          [
            { text: dto.prompt },
            { image: this.ossService.resolveReadableUrl(inputImageUrl) },
          ],
          options,
        )
      : await this.generateByText([{ text: dto.prompt }], options);

    const url = await this.ossService.uploadFromUrl(resultUrl);

    return this.imageStore.add({
      prompt: dto.prompt,
      url,
      inputImageUrl,
      mode: inputImageUrl ? 'edit' : 'text',
      size: options.size ?? (inputImageUrl ? '1K' : '1280*1280'),
    });
  }

  listImages(): ImageRecord[] {
    return this.imageStore.list();
  }

  deleteImage(id: string): void {
    this.imageStore.remove(id);
  }

  getUploadSignature(ext?: string) {
    return this.ossService.createUploadPolicy(ext);
  }

  private async generateByEdit(
    content: Array<{ text?: string; image?: string }>,
    options: WanImageOptions,
  ): Promise<string> {
    const raw = await this.wanCall({
      model: 'wan2.6-image',
      messages: [{ role: 'user', content }],
      prompt_extend: options.promptExtend,
      watermark: options.watermark,
      n: 1,
      enable_interleave: false,
      size: options.size ?? '1K',
    });

    const result = raw;
    this.assertSuccess(result);

    const resultUrl = this.extractImageUrl(result);
    if (!resultUrl) {
      throw new BadRequestException(
        `No image URL in DashScope response: ${JSON.stringify(result)}`,
      );
    }

    return resultUrl;
  }

  private async generateByText(
    content: Array<{ text?: string; image?: string }>,
    options: WanImageOptions,
  ): Promise<string> {
    const startedAt = Date.now();
    this.logger.log('text-to-image started (wan2.6-t2i sync)');

    const raw = await this.wanCall({
      model: 'wan2.6-t2i',
      messages: [{ role: 'user', content }],
      prompt_extend: options.promptExtend,
      watermark: options.watermark,
      n: 1,
      size: options.size ?? '1280*1280',
    });

    const result = raw;
    this.assertSuccess(result);

    const resultUrl = this.extractImageUrl(result);
    if (!resultUrl) {
      throw new BadRequestException(
        `No image URL in DashScope response: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(`text-to-image finished in ${Date.now() - startedAt}ms`);

    return resultUrl;
  }

  private extractImageUrl(result: GenerationResult): string | undefined {
    const content = result.output?.choices?.[0]?.message?.content;
    if (!Array.isArray(content)) {
      return undefined;
    }

    for (const item of content) {
      if (item.image) {
        return item.image;
      }
    }

    return undefined;
  }

  private assertSuccess(result: GenerationResult): void {
    if (result.status_code !== 200 || result.code) {
      throw new BadRequestException(
        result.message ?? `DashScope request failed: ${result.status_code}`,
      );
    }
  }

  private wanCall(options: {
    model: string;
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: Array<{ text?: string; image?: string }>;
    }>;
    [key: string]: unknown;
  }): Promise<GenerationResult> {
    // 当前实现直接调用 SDK 1.26.0 的私有 syncRequest，以显式构造原生请求体。
    // 不同于独立脚本的公开 call；类型断言不能保证升级后的内部 API 兼容性。
    const { model, messages, ...rest } = options;
    return (
      this.client as unknown as MultiModalConversationInternal
    ).syncRequest({
      model,
      input: { messages },
      parameters: { ...rest, stream: false },
    });
  }
}
