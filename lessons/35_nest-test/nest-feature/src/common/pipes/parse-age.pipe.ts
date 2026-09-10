/** 复习 02：Query 默认是字符串，Pipe 同时完成转换与范围检查。当前允许 0～150 的小数，Number 也接受部分非十进制写法，不等同于严格整数年龄校验。 */
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseAgePipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`参数 ${metadata.data ?? 'age'} 不能为空`);
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      throw new BadRequestException(
        `参数 ${metadata.data ?? 'age'} 必须是有效数字，当前值: ${value}`,
      );
    }

    if (parsed < 0 || parsed > 150) {
      throw new BadRequestException('年龄必须在 0 ~ 150 之间');
    }

    return parsed;
  }
}
