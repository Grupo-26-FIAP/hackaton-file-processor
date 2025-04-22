import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../../../../src/shared/services/s3.service';

// Mock do módulo S3Client
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  const mockS3Client = jest.fn(() => ({
    send: mockSend,
  }));
  mockS3Client.prototype.send = mockSend;
  return {
    ...jest.requireActual('@aws-sdk/client-s3'),
    S3Client: mockS3Client,
  };
});

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: jest.Mocked<S3Client>;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('us-east-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    mockS3Client = (S3Client as jest.MockedClass<typeof S3Client>).mock
      .instances[0] as jest.Mocked<S3Client>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadFile', () => {
    it('should download a file from S3', async () => {
      const bucket = 'test-bucket';
      const key = 'test-key.mp4';
      const mockBuffer = Buffer.from('test data');

      // Mock the S3 client send method
      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          [Symbol.asyncIterator]: function* () {
            yield mockBuffer;
          },
        },
      });

      const result = await service.downloadFile(bucket, key);

      expect(result).toEqual(mockBuffer);
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucket,
            Key: key,
          },
        }),
      );
    });

    it('should handle errors when downloading a file', async () => {
      const bucket = 'test-bucket';
      const key = 'test-key.mp4';
      const error = new Error('Download failed');

      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.downloadFile(bucket, key)).rejects.toThrow(
        'Download failed',
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload a file to S3', async () => {
      const bucket = 'test-bucket';
      const key = 'test-key.mp4';
      const body = Buffer.from('test data');

      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({});

      await service.uploadFile(bucket, key, body);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucket,
            Key: key,
            Body: body,
          },
        }),
      );
    });

    it('should handle errors when uploading a file', async () => {
      const bucket = 'test-bucket';
      const key = 'test-key.mp4';
      const body = Buffer.from('test data');
      const error = new Error('Upload failed');

      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.uploadFile(bucket, key, body)).rejects.toThrow(
        'Upload failed',
      );
    });
  });
});
