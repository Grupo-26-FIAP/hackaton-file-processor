import { VideoJobStatus } from '../../../src/database/enums/video-job-status.enum';

export const mockVideoJobDto = {
  userId: 'test-user-id',
  inputBucket: 'test-input-bucket',
  inputKey: 'test-input-key',
  status: VideoJobStatus.PROCESSING,
  createdAt: new Date(),
  updatedAt: new Date(),
};
