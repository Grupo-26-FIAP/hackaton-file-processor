import { validate } from 'class-validator';
import { CreateVideoJobDto } from '../../../../src/modules/video/dto/create-video-job.dto';

describe('CreateVideoJobDto', () => {
  let dto: CreateVideoJobDto;

  beforeEach(() => {
    dto = new CreateVideoJobDto();
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO', async () => {
    dto.userId = 'user-123';
    dto.inputBucket = 'my-video-bucket';
    dto.inputKey = 'videos/input/my-video.mp4';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate userId format', async () => {
    dto.inputBucket = 'my-video-bucket';
    dto.inputKey = 'videos/input/my-video.mp4';

    // Test empty userId
    dto.userId = '';
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');

    // Test invalid userId format
    dto.userId = 'user@123';
    errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should validate inputBucket format', async () => {
    dto.userId = 'user-123';
    dto.inputKey = 'videos/input/my-video.mp4';

    // Test empty inputBucket
    dto.inputBucket = '';
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');

    // Test invalid inputBucket format
    dto.inputBucket = 'MY-BUCKET';
    errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should validate inputKey format', async () => {
    dto.userId = 'user-123';
    dto.inputBucket = 'my-video-bucket';

    // Test empty inputKey
    dto.inputKey = '';
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');

    // Test invalid inputKey format
    dto.inputKey = 'videos/input/my-video@.mp4';
    errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('matches');
  });
});
