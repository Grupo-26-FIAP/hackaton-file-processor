import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoModule } from '../video/video.module';
import { FileProcessorConsumerService } from './consumers/file-processor-consumer.service';
import { QueueController } from './controllers/queue.controller';
import { NotifierProducerService } from './producers/notifier-producer.service';

@Module({
  imports: [ConfigModule, VideoModule],
  controllers: [QueueController],
  providers: [NotifierProducerService, FileProcessorConsumerService],
  exports: [NotifierProducerService],
})
export class QueueModule {}
