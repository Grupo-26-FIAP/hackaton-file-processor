import { VideoJob } from 'src/database/entities/video-job.entity';
import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';

describe('VideoJob Entity', () => {
  let videoJob: VideoJob;

  beforeEach(() => {
    videoJob = new VideoJob();
  });

  it('should be defined', () => {
    expect(videoJob).toBeDefined();
  });

  it('should create a valid video job', () => {
    const now = new Date();
    videoJob.id = '1';
    videoJob.userId = 'user-123';
    videoJob.jobId = 'job-123';
    videoJob.status = VideoJobStatus.PROCESSING;
    videoJob.inputBucket = 'my-video-bucket';
    videoJob.inputKey = 'videos/input/my-video.mp4';
    videoJob.outputBucket = 'my-processed-bucket';
    videoJob.outputKey = 'videos/output/my-video.mp4';
    videoJob.error = null;
    videoJob.createdAt = now;
    videoJob.updatedAt = now;

    expect(videoJob.id).toBe('1');
    expect(videoJob.userId).toBe('user-123');
    expect(videoJob.jobId).toBe('job-123');
    expect(videoJob.status).toBe(VideoJobStatus.PROCESSING);
    expect(videoJob.inputBucket).toBe('my-video-bucket');
    expect(videoJob.inputKey).toBe('videos/input/my-video.mp4');
    expect(videoJob.outputBucket).toBe('my-processed-bucket');
    expect(videoJob.outputKey).toBe('videos/output/my-video.mp4');
    expect(videoJob.error).toBeNull();
    expect(videoJob.createdAt).toBeInstanceOf(Date);
    expect(videoJob.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle error message when status is FAILED', () => {
    const errorMessage = 'Processing failed';
    videoJob.status = VideoJobStatus.FAILED;
    videoJob.error = errorMessage;

    expect(videoJob.error).toBe(errorMessage);
  });

  it('should have all required properties defined in the class', () => {
    // Verificando se as propriedades estão definidas no protótipo da classe
    expect(Object.keys(Object.getPrototypeOf(videoJob))).toEqual([]);

    // Verificando se as propriedades podem ser atribuídas e acessadas
    const testData = {
      id: '1',
      userId: 'user-123',
      jobId: 'job-123',
      status: VideoJobStatus.PROCESSING,
      inputBucket: 'test-bucket',
      inputKey: 'test-key',
      outputBucket: 'output-bucket',
      outputKey: 'output-key',
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Object.assign(videoJob, testData);

    expect(videoJob.id).toBeDefined();
    expect(videoJob.userId).toBeDefined();
    expect(videoJob.jobId).toBeDefined();
    expect(videoJob.status).toBeDefined();
    expect(videoJob.inputBucket).toBeDefined();
    expect(videoJob.inputKey).toBeDefined();
    expect(videoJob.outputBucket).toBeDefined();
    expect(videoJob.outputKey).toBeDefined();
    expect(videoJob.error).toBeDefined();
    expect(videoJob.createdAt).toBeDefined();
    expect(videoJob.updatedAt).toBeDefined();
  });
});
