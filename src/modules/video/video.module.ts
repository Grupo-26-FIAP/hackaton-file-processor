import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from '@Shared/services/s3.service';
import { VideoJob } from '../../database/entities/video-job.entity';
import { NotifierProducerService } from '../queue/producers/notifier-producer.service';
import { VideoController } from './controllers/video.controller';
import { VideoRepository } from './repositories/video.repository';
import { ProcessorService } from './services/processor.service';
import { VideoService } from './services/video.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJob])],
  controllers: [VideoController],
  providers: [
    VideoService,
    VideoRepository,
    ProcessorService,
    NotifierProducerService,
    S3Service,
  ],
  exports: [
    VideoService,
    VideoRepository,
    ProcessorService,
    NotifierProducerService,
    S3Service,
  ],
})
export class VideoModule {}
