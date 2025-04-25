import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';
import { CreateVideoJobDto } from 'src/modules/video/dto/create-video-job.dto';
import { VideoRepository } from 'src/modules/video/repositories/video.repository';
import { VideoService } from 'src/modules/video/services/video.service';

describe('VideoService', () => {
  let service: VideoService;

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

  const mockVideoJobDto = {
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

  const mockRepository = {
    createVideoJob: jest.fn(),
    findAll: jest.fn(),
    findVideoJobById: jest.fn(),
    findByStatus: jest.fn(),
    updateVideoJob: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: VideoRepository,
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new video job', async () => {
      const createDto: CreateVideoJobDto = {
        userId: 'user-123',
        inputBucket: 'test-bucket',
        inputKey: 'test-key.mp4',
      };

      mockRepository.createVideoJob.mockResolvedValue(mockVideoJob);

      const result = await service.create(createDto);

      expect(result).toMatchObject({
        userId: mockVideoJobDto.userId,
        jobId: mockVideoJobDto.jobId,
        status: mockVideoJobDto.status,
        inputBucket: mockVideoJobDto.inputBucket,
        inputKey: mockVideoJobDto.inputKey,
        outputBucket: mockVideoJobDto.outputBucket,
        outputKey: mockVideoJobDto.outputKey,
        error: mockVideoJobDto.error,
      });
      expect(mockRepository.createVideoJob).toHaveBeenCalledWith({
        ...createDto,
        status: VideoJobStatus.PROCESSING,
      });
    });

    it('should handle errors during creation', async () => {
      const createDto: CreateVideoJobDto = {
        userId: 'user-123',
        inputBucket: 'test-bucket',
        inputKey: 'test-key.mp4',
      };

      const error = new Error('Database error');
      mockRepository.createVideoJob.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated video jobs', async () => {
      const options = { page: 1, limit: 10 };
      const expectedResult = {
        items: [mockVideoJob],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockRepository.findAll.mockResolvedValue(expectedResult);

      const result = await service.findAll(options);

      expect(result.items[0]).toMatchObject({
        userId: mockVideoJobDto.userId,
        jobId: mockVideoJobDto.jobId,
        status: mockVideoJobDto.status,
        inputBucket: mockVideoJobDto.inputBucket,
        inputKey: mockVideoJobDto.inputKey,
        outputBucket: mockVideoJobDto.outputBucket,
        outputKey: mockVideoJobDto.outputKey,
        error: mockVideoJobDto.error,
      });
      expect(result.meta).toEqual(expectedResult.meta);
      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('findOne', () => {
    it('should return a video job by id', async () => {
      mockRepository.findVideoJobById.mockResolvedValue(mockVideoJob);

      const result = await service.findOne('1');

      expect(result).toMatchObject({
        userId: mockVideoJobDto.userId,
        jobId: mockVideoJobDto.jobId,
        status: mockVideoJobDto.status,
        inputBucket: mockVideoJobDto.inputBucket,
        inputKey: mockVideoJobDto.inputKey,
        outputBucket: mockVideoJobDto.outputBucket,
        outputKey: mockVideoJobDto.outputKey,
        error: mockVideoJobDto.error,
      });
      expect(mockRepository.findVideoJobById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if video job not found', async () => {
      mockRepository.findVideoJobById.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStatus', () => {
    it('should return paginated video jobs by status and userId', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = 'user-123';
      const options = { page: 1, limit: 10 };
      const expectedResult = {
        items: [mockVideoJob],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockRepository.findByStatus.mockResolvedValue(expectedResult);

      const result = await service.findByStatus(status, userId, options);

      expect(result.items[0]).toMatchObject({
        userId: mockVideoJobDto.userId,
        jobId: mockVideoJobDto.jobId,
        status: mockVideoJobDto.status,
        inputBucket: mockVideoJobDto.inputBucket,
        inputKey: mockVideoJobDto.inputKey,
        outputBucket: mockVideoJobDto.outputBucket,
        outputKey: mockVideoJobDto.outputKey,
        error: mockVideoJobDto.error,
      });
      expect(result.meta).toEqual(expectedResult.meta);
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(
        status,
        userId,
        options,
      );
    });

    it('should return empty list when no jobs exist for status and userId', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = 'user-123';
      const options = { page: 1, limit: 10 };
      const expectedResult = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      mockRepository.findByStatus.mockResolvedValue(expectedResult);

      const result = await service.findByStatus(status, userId, options);

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(
        status,
        userId,
        options,
      );
    });
  });
});
