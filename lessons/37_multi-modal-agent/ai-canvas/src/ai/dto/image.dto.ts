import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImageDto {
  // 请求字段由 ValidationPipe 转换时赋值，必填约束由下方装饰器校验。
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  prompt!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  imageUrl?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value ?? true)
  promptExtend?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  watermark?: boolean;
}
