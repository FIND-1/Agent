import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AiModule } from './ai/ai.module';
import { SpeechModule } from './speech/speech.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '..', '..', '.env'),
    }),
    EventEmitterModule.forRoot({
      maxListeners: 200,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
    }),
    AiModule,
    SpeechModule,
  ],
})
export class AppModule {}
