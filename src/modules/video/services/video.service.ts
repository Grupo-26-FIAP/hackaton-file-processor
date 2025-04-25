import { Injectable, NotFoundException } from '@nestjs/common';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { VideoJob } from '../../../database/entities/video-job.entity';
import { VideoJobStatus } from '../../../database/enums/video-job-status.enum';
import { CreateVideoJobDto } from '../dto/create-video-job.dto';
import { VideoJobDto } from '../dto/video-job.dto';
import { VideoRepository } from '../repositories/video.repository';

@Injectable()
export class VideoService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async create(createVideoJobDto: CreateVideoJobDto): Promise<VideoJobDto> {
    const videoJob = await this.videoRepository.createVideoJob({
      ...createVideoJobDto,
      status: VideoJobStatus.PROCESSING,
    });
    return this.toDto(videoJob);
  }

  async findVideoJobById(id: string): Promise<VideoJob | null> {
    return this.videoRepository.findVideoJobById(id);
  }

  async findOne(id: string): Promise<VideoJobDto> {
    const videoJob = await this.videoRepository.findVideoJobById(id);
    if (!videoJob) {
      throw new NotFoundException('Video job not found');
    }
    return this.toDto(videoJob);
  }

  async updateVideoJob(
    id: string,
    data: Partial<VideoJob>,
  ): Promise<VideoJob | null> {
    return this.videoRepository.updateVideoJob(id, data);
  }

  async findAll(options: IPaginationOptions) {
    const result = await this.videoRepository.findAll(options);
    return {
      ...result,
      items: result.items.map(this.toDto),
    };
  }

  async findByStatus(
    status: VideoJobStatus,
    userId: string,
    options: IPaginationOptions,
  ) {
    const result = await this.videoRepository.findByStatus(
      status,
      userId,
      options,
    );
    return {
      ...result,
      items: result.items.map(this.toDto),
    };
  }

  private toDto(videoJob: VideoJob): VideoJobDto {
    return {
      id: videoJob.id,
      userId: videoJob.userId,
      jobId: videoJob.jobId,
      status: videoJob.status,
      inputBucket: videoJob.inputBucket,
      inputKey: videoJob.inputKey,
      outputBucket: videoJob.outputBucket,
      outputKey: videoJob.outputKey,
      error: videoJob.error,
      createdAt: videoJob.createdAt,
      updatedAt: videoJob.updatedAt,
    };
  }
}
