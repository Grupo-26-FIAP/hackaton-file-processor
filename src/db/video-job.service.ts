import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoJob, VideoJobDocument } from './video-job.schema';

@Injectable()
export class VideoJobService {
  constructor(
    @InjectModel(VideoJob.name) private jobModel: Model<VideoJobDocument>,
  ) {}

  create(data: Partial<VideoJob>) {
    return this.jobModel.create(data);
  }

  updateStatus(id: string, status: string, errorMessage?: string) {
    return this.jobModel.findByIdAndUpdate(id, {
      status,
      errorMessage,
    });
  }
}
