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

      expect(result).toEqual(mockVideoJobDto);
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

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('findOne', () => {
    it('should return a video job by id', async () => {
      mockRepository.findVideoJobById.mockResolvedValue(mockVideoJob);

      const result = await service.findOne('1');

      expect(result).toEqual(mockVideoJobDto);
      expect(mockRepository.findVideoJobById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if video job not found', async () => {
      mockRepository.findVideoJobById.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow('Video job not found');
    });
  });

  describe('updateStatus', () => {
    it('should update video job status', async () => {
      const updatedJob = { ...mockVideoJob, status: VideoJobStatus.COMPLETED };
      mockRepository.findVideoJobById.mockResolvedValue(mockVideoJob);
      mockRepository.updateVideoJob.mockResolvedValue(updatedJob);

      const result = await service.updateStatus('1', VideoJobStatus.COMPLETED);

      expect(result).toEqual({
        ...mockVideoJobDto,
        status: VideoJobStatus.COMPLETED,
      });
      expect(mockRepository.updateVideoJob).toHaveBeenCalledWith('1', {
        status: VideoJobStatus.COMPLETED,
      });
    });

    it('should handle errors during status update', async () => {
      mockRepository.findVideoJobById.mockResolvedValue(mockVideoJob);
      const error = new Error('Update failed');
      mockRepository.updateVideoJob.mockRejectedValue(error);

      await expect(
        service.updateStatus('1', VideoJobStatus.COMPLETED),
      ).rejects.toThrow('Update failed');
    });

    it('should throw NotFoundException if video job not found during update', async () => {
      mockRepository.findVideoJobById.mockResolvedValue(null);

      await expect(
        service.updateStatus('1', VideoJobStatus.COMPLETED),
      ).rejects.toThrow('Video job not found');
    });
  });

  describe('getByStatus', () => {
    it('should return paginated video jobs by status', async () => {
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

      const result = await service.getByStatus(
        VideoJobStatus.PROCESSING,
        options,
      );

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(
        VideoJobStatus.PROCESSING,
        options,
      );
    });
  });
});
