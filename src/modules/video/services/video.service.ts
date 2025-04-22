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
    return this.mapToDto(videoJob);
  }

  async findAll(options: IPaginationOptions) {
    const result = await this.videoRepository.findAll(options);
    return {
      ...result,
      items: result.items.map((job) => this.mapToDto(job)),
    };
  }

  async getByStatus(status: VideoJobStatus, options: IPaginationOptions) {
    const result = await this.videoRepository.findByStatus(status, options);
    return {
      ...result,
      items: result.items.map((job) => this.mapToDto(job)),
    };
  }

  async findOne(id: string): Promise<VideoJobDto> {
    const videoJob = await this.videoRepository.findVideoJobById(id);
    if (!videoJob) {
      throw new NotFoundException('Video job not found');
    }
    return this.mapToDto(videoJob);
  }

  async updateStatus(
    id: string,
    status: VideoJobStatus,
    error?: string,
  ): Promise<VideoJobDto> {
    await this.findOne(id);
    const videoJob = await this.videoRepository.updateVideoJob(id, {
      status,
      error,
    });
    return this.mapToDto(videoJob);
  }

  async updateOutput(
    id: string,
    outputBucket: string,
    outputKey: string,
  ): Promise<VideoJobDto> {
    await this.findOne(id);
    const videoJob = await this.videoRepository.updateVideoJob(id, {
      outputBucket,
      outputKey,
    });
    return this.mapToDto(videoJob);
  }

  private mapToDto(videoJob: VideoJob): VideoJobDto {
    return {
      id: videoJob.id,
      userId: videoJob.userId,
      jobId: videoJob.jobId,
      inputBucket: videoJob.inputBucket,
      inputKey: videoJob.inputKey,
      outputBucket: videoJob.outputBucket || '',
      outputKey: videoJob.outputKey || '',
      status: videoJob.status,
      error: videoJob.error,
      createdAt: videoJob.createdAt,
      updatedAt: videoJob.updatedAt,
    };
  }
}
