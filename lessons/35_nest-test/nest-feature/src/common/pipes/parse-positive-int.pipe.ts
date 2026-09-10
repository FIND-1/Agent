/** 复习 02：在 Handler 前把路径参数转成正整数；字符串回比拒绝 01、1abc、1.0 等写法。未额外检查安全整数上限，不能直接当作生产 ID 校验器。 */
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = Number.parseInt(value, 10);

    if (
      Number.isNaN(parsed) ||
      parsed <= 0 ||
      !Number.isInteger(parsed) ||
      String(parsed) !== value
    ) {
      throw new BadRequestException(
        `参数 ${metadata.data ?? 'id'} 必须是正整数，当前值: ${value}`,
      );
    }

    return parsed;
  }
}
