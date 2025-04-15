// scripts/test-message.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProcessorService } from '../processor/processor.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const processor = app.get(ProcessorService);

  await processor.handleMessage({
    userId: 'user-test-123',
    bucket: 'your-bucket-name',
    key: 'test-videos/sample.mp4',
  });

  await app.close();
}

bootstrap().catch(console.error);
