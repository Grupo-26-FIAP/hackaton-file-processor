import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { FindOneOptions, Repository } from 'typeorm';
import { VideoJob } from '../../../database/entities/video-job.entity';
import { VideoJobStatus } from '../../../database/enums/video-job-status.enum';

@Injectable()
export class VideoRepository extends Repository<VideoJob> {
  constructor(
    @InjectRepository(VideoJob)
    private readonly repository: Repository<VideoJob>,
  ) {
    super(VideoJob, repository.manager);
  }

  async createVideoJob(videoJob: Partial<VideoJob>): Promise<VideoJob> {
    const entity = this.repository.create(videoJob);
    return await this.repository.save(entity);
  }

  async findAll(options: IPaginationOptions) {
    const queryBuilder = this.repository.createQueryBuilder('video');
    queryBuilder.orderBy('video.createdAt', 'DESC');
    return await paginate(queryBuilder, options);
  }

  async findVideoJobById(id: string): Promise<VideoJob | null> {
    return await this.repository.findOne({
      where: { id },
    } as FindOneOptions<VideoJob>);
  }

  async findByStatus(status: VideoJobStatus, options: IPaginationOptions) {
    const queryBuilder = this.repository.createQueryBuilder('video');
    queryBuilder.where('video.status = :status', { status });
    queryBuilder.orderBy('video.createdAt', 'DESC');
    return await paginate(queryBuilder, options);
  }

  async updateVideoJob(id: string, data: Partial<VideoJob>): Promise<VideoJob> {
    const updateResult = await this.repository.update(id, data);
    if (updateResult.affected === 0) {
      return null;
    }
    return await this.findVideoJobById(id);
  }
}
