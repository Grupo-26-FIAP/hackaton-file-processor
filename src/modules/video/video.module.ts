import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoJob } from '../../database/entities/video-job.entity';
import { VideoController } from './controllers/video.controller';
import { VideoRepository } from './repositories/video.repository';
import { ProcessorService } from './services/processor.service';
import { VideoService } from './services/video.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJob])],
  controllers: [VideoController],
  providers: [VideoService, VideoRepository, ProcessorService],
  exports: [VideoService, VideoRepository, ProcessorService],
})
export class VideoModule {}
