import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoJobStatus } from '../../../../src/database/enums/video-job-status.enum';
import { VideoController } from '../../../../src/modules/video/controllers/video.controller';
import { CreateVideoJobDto } from '../../../../src/modules/video/dto/create-video-job.dto';
import { VideoService } from '../../../../src/modules/video/services/video.service';

describe('VideoController', () => {
  let controller: VideoController;

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

  const mockVideoService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    getByStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: VideoService,
          useValue: mockVideoService,
        },
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
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

      mockVideoService.create.mockResolvedValue(mockVideoJobDto);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockVideoJobDto);
      expect(mockVideoService.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle errors during creation', async () => {
      const createDto: CreateVideoJobDto = {
        userId: 'user-123',
        inputBucket: 'test-bucket',
        inputKey: 'test-key.mp4',
      };

      const error = new Error('Creation failed');
      mockVideoService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated video jobs', async () => {
      const page = 1;
      const limit = 10;

      const mockPaginatedResult = {
        items: [mockVideoJobDto],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockVideoService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(page, limit);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockVideoService.findAll).toHaveBeenCalledWith({ page, limit });
    });

    it('should return empty list when no jobs exist', async () => {
      const page = 1;
      const limit = 10;

      const mockEmptyResult = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      mockVideoService.findAll.mockResolvedValue(mockEmptyResult);

      const result = await controller.findAll(page, limit);

      expect(result).toEqual(mockEmptyResult);
      expect(mockVideoService.findAll).toHaveBeenCalledWith({ page, limit });
    });

    it('should throw BadRequestException for invalid page number', async () => {
      const page = 0;
      const limit = 10;

      await expect(controller.findAll(page, limit)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVideoService.findAll).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid limit', async () => {
      const page = 1;
      const limit = 0;

      await expect(controller.findAll(page, limit)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVideoService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a video job by id', async () => {
      const id = '1';
      mockVideoService.findOne.mockResolvedValue(mockVideoJobDto);

      const result = await controller.findOne(id);

      expect(result).toEqual(mockVideoJobDto);
      expect(mockVideoService.findOne).toHaveBeenCalledWith(id);
    });

    it('should handle not found video job', async () => {
      const id = '999';
      const error = new Error('Video job with ID 999 not found');
      mockVideoService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id)).rejects.toThrow(
        'Video job with ID 999 not found',
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      const id = '';

      await expect(controller.findOne(id)).rejects.toThrow(BadRequestException);
      expect(mockVideoService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getByStatus', () => {
    it('should return paginated video jobs by status', async () => {
      const status = VideoJobStatus.PROCESSING;
      const page = 1;
      const limit = 10;

      const mockPaginatedResult = {
        items: [mockVideoJobDto],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockVideoService.getByStatus.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getByStatus(status, page, limit);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockVideoService.getByStatus).toHaveBeenCalledWith(status, {
        page,
        limit,
      });
    });

    it('should return empty list when no jobs exist with given status', async () => {
      const status = VideoJobStatus.COMPLETED;
      const page = 1;
      const limit = 10;

      const mockEmptyResult = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      mockVideoService.getByStatus.mockResolvedValue(mockEmptyResult);

      const result = await controller.getByStatus(status, page, limit);

      expect(result).toEqual(mockEmptyResult);
      expect(mockVideoService.getByStatus).toHaveBeenCalledWith(status, {
        page,
        limit,
      });
    });

    it('should handle different job statuses', async () => {
      const statuses = [
        VideoJobStatus.PROCESSING,
        VideoJobStatus.COMPLETED,
        VideoJobStatus.FAILED,
      ];

      for (const status of statuses) {
        const mockResult = {
          items: [{ ...mockVideoJobDto, status }],
          meta: {
            totalItems: 1,
            itemCount: 1,
            itemsPerPage: 10,
            totalPages: 1,
            currentPage: 1,
          },
        };

        mockVideoService.getByStatus.mockResolvedValue(mockResult);

        const result = await controller.getByStatus(status, 1, 10);

        expect(result.items[0].status).toBe(status);
        expect(mockVideoService.getByStatus).toHaveBeenCalledWith(status, {
          page: 1,
          limit: 10,
        });
      }
    });

    it('should throw BadRequestException for invalid page number', async () => {
      const status = VideoJobStatus.PROCESSING;
      const page = 0;
      const limit = 10;

      await expect(controller.getByStatus(status, page, limit)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVideoService.getByStatus).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid limit', async () => {
      const status = VideoJobStatus.PROCESSING;
      const page = 1;
      const limit = 0;

      await expect(controller.getByStatus(status, page, limit)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVideoService.getByStatus).not.toHaveBeenCalled();
    });
  });
});
