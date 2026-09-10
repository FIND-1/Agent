// 只演示记录层：与 OSS 的对象存储分离，重启清空，remove 也不会删除云端文件。
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ImageRecord } from './image-record.interface';

@Injectable()
export class ImageStoreService {
  private readonly items: ImageRecord[] = [];

  list(): ImageRecord[] {
    return [...this.items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  add(record: Omit<ImageRecord, 'id' | 'createdAt'>): ImageRecord {
    const item: ImageRecord = {
      ...record,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.items.unshift(item);
    return item;
  }

  remove(id: string): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Image record ${id} not found`);
    }
    this.items.splice(index, 1);
  }
}
