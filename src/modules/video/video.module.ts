import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoJob } from '../../database/entities/video-job.entity';
import { VideoController } from './controllers/video.controller';
import { VideoRepository } from './repositories/video.repository';
import { VideoService } from './services/video.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJob])],
  controllers: [VideoController],
  providers: [VideoService, VideoRepository],
  exports: [VideoService],
})
export class VideoModule {}
