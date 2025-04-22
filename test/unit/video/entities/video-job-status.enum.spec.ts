import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';

describe('VideoJobStatus Enum', () => {
  it('should have all required status values', () => {
    expect(VideoJobStatus.PENDING).toBe('pending');
    expect(VideoJobStatus.PROCESSING).toBe('processing');
    expect(VideoJobStatus.COMPLETED).toBe('completed');
    expect(VideoJobStatus.FAILED).toBe('failed');
  });

  it('should have exactly four status values', () => {
    const statusValues = Object.values(VideoJobStatus);
    expect(statusValues).toHaveLength(4);
  });

  it('should have all required status values', () => {
    const requiredStatuses = ['pending', 'processing', 'completed', 'failed'];
    const enumValues = Object.values(VideoJobStatus);

    requiredStatuses.forEach((status) => {
      expect(enumValues).toContain(status);
    });
  });
});
