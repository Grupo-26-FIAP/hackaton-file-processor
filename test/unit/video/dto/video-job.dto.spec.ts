import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';
import { VideoJobDto } from 'src/modules/video/dto/video-job.dto';

describe('VideoJobDto', () => {
  let dto: VideoJobDto;

  beforeEach(() => {
    dto = new VideoJobDto();
    // Inicializar as propriedades necessárias
    Object.assign(dto, {
      id: '1',
      userId: 'user-123',
      jobId: 'job-123',
      status: VideoJobStatus.PROCESSING,
      inputBucket: 'test-bucket',
      inputKey: 'test-key.mp4',
      outputBucket: 'output-bucket',
      outputKey: 'output-key.zip',
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  it('should create a valid DTO from entity data', () => {
    const now = new Date();
    const entityData = {
      id: '1',
      userId: 'user-123',
      jobId: 'job-123',
      status: VideoJobStatus.PROCESSING,
      inputBucket: 'my-video-bucket',
      inputKey: 'videos/input/my-video.mp4',
      outputBucket: 'my-processed-bucket',
      outputKey: 'videos/output/my-video.mp4',
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    Object.assign(dto, entityData);

    expect(dto.id).toBe(entityData.id);
    expect(dto.userId).toBe(entityData.userId);
    expect(dto.jobId).toBe(entityData.jobId);
    expect(dto.status).toBe(entityData.status);
    expect(dto.inputBucket).toBe(entityData.inputBucket);
    expect(dto.inputKey).toBe(entityData.inputKey);
    expect(dto.outputBucket).toBe(entityData.outputBucket);
    expect(dto.outputKey).toBe(entityData.outputKey);
    expect(dto.error).toBeNull();
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle error message when status is FAILED', () => {
    const errorMessage = 'Processing failed';
    dto.status = VideoJobStatus.FAILED;
    dto.error = errorMessage;

    expect(dto.error).toBe(errorMessage);
  });

  it('should have all required properties', () => {
    const properties = Object.getOwnPropertyNames(dto);
    expect(properties).toContain('id');
    expect(properties).toContain('userId');
    expect(properties).toContain('jobId');
    expect(properties).toContain('status');
    expect(properties).toContain('inputBucket');
    expect(properties).toContain('inputKey');
    expect(properties).toContain('outputBucket');
    expect(properties).toContain('outputKey');
    expect(properties).toContain('error');
    expect(properties).toContain('createdAt');
    expect(properties).toContain('updatedAt');
  });
});
