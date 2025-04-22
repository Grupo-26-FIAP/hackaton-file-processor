import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import archiver from 'archiver';
import { exec } from 'child_process';
import { createReadStream, createWriteStream, mkdirSync, rmSync } from 'fs';
import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';
import { NotifierProducerService } from 'src/modules/queue/producers/notifier-producer.service';
import { ProcessorService } from 'src/modules/video/services/processor.service';
import { VideoService } from 'src/modules/video/services/video.service';
import { S3Service } from 'src/shared/services/s3.service';
import { pipeline } from 'stream/promises';

// Mock all external dependencies
jest.mock('child_process');
jest.mock('fs', () => ({
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdtemp: jest.fn().mockResolvedValue('/tmp/video-processor-123'),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('stream/promises');
jest.mock('archiver');
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Body: {
        [Symbol.asyncIterator]: function* () {
          yield Buffer.from('test video data');
        },
      },
    }),
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

// Mock VideoRepository
jest.mock('src/modules/video/repositories/video.repository', () => {
  return {
    VideoRepository: jest.fn().mockImplementation(() => ({
      findVideoJobById: jest.fn(),
      updateVideoJob: jest.fn(),
    })),
  };
});

describe('ProcessorService', () => {
  let service: ProcessorService;

  const mockVideoJob = {
    id: '1',
    userId: 'user-123',
    jobId: 'job-123',
    status: VideoJobStatus.PROCESSING,
    inputBucket: 'test-bucket',
    inputKey: 'test-key.mp4',
    outputBucket: 'output-bucket',
    outputKey: 'output-key.zip',
    error: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('us-east-1'),
  };

  const mockVideoService = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockNotifierProducer = {
    sendNotification: jest.fn(),
  };

  const mockS3Service = {
    downloadFile: jest.fn(),
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: VideoService,
          useValue: mockVideoService,
        },
        {
          provide: NotifierProducerService,
          useValue: mockNotifierProducer,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<ProcessorService>(ProcessorService);

    // Mock fs functions
    (mkdirSync as jest.Mock).mockImplementation(() => {});
    (rmSync as jest.Mock).mockImplementation(() => {});
    (createWriteStream as jest.Mock).mockImplementation(() => ({
      on: jest.fn(),
      pipe: jest.fn(),
    }));
    (createReadStream as jest.Mock).mockImplementation(() => ({}));

    // Mock pipeline
    (pipeline as jest.Mock).mockResolvedValue(undefined);

    // Mock archiver
    (archiver as unknown as jest.Mock).mockImplementation(() => ({
      pipe: jest.fn(),
      directory: jest.fn(),
      finalize: jest.fn(),
      on: jest.fn(),
      file: jest.fn(),
    }));

    // Mock exec
    (exec as unknown as jest.Mock).mockImplementation((command, callback) => {
      callback(null, { stdout: '', stderr: '' });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should process a video message successfully', async () => {
      const messageData = {
        id: '1',
        userId: 'user-123',
        bucket: 'test-bucket',
        key: 'test-key.mp4',
      };

      mockVideoService.findOne.mockResolvedValue(mockVideoJob);
      mockS3Service.downloadFile.mockResolvedValue(
        Buffer.from('test video data'),
      );
      mockS3Service.uploadFile.mockResolvedValue(undefined);
      mockVideoService.updateStatus.mockResolvedValue({
        ...mockVideoJob,
        status: VideoJobStatus.COMPLETED,
      });

      await service.handleMessage(messageData);

      expect(mockVideoService.findOne).toHaveBeenCalledWith(messageData.id);
      expect(mockVideoService.updateStatus).toHaveBeenCalledWith(
        mockVideoJob.id,
        VideoJobStatus.COMPLETED,
      );

      expect(mockNotifierProducer.sendNotification).toHaveBeenCalledWith(
        JSON.stringify({
          userId: mockVideoJob.userId,
          jobId: mockVideoJob.id,
          status: VideoJobStatus.COMPLETED,
          message: 'Video processing completed successfully',
        }),
      );
    });

    it('should handle errors during video processing', async () => {
      const messageData = {
        id: '1',
        userId: 'user-123',
        bucket: 'test-bucket',
        key: 'test-key.mp4',
      };

      const error = new Error('Processing failed');
      mockVideoService.findOne.mockResolvedValue(mockVideoJob);

      // Mock the downloadFromS3 method to throw an error
      jest.spyOn(service as any, 'downloadFromS3').mockRejectedValue(error);

      // Ensure the error is propagated
      await expect(service.handleMessage(messageData)).rejects.toThrow(
        'Processing failed',
      );

      expect(mockVideoService.updateStatus).toHaveBeenCalledWith(
        mockVideoJob.id,
        VideoJobStatus.FAILED,
        error.message,
      );
    });
  });
});
