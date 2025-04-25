import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoJobStatus } from '../../../../src/database/enums/video-job-status.enum';
import { VideoController } from '../../../../src/modules/video/controllers/video.controller';
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
    findByStatus: jest.fn(),
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

  describe('findAll', () => {
    it('should return paginated video jobs', async () => {
      const page = 1;
      const limit = 10;
      const expectedOptions = { page, limit };

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
      expect(mockVideoService.findAll).toHaveBeenCalledWith(expectedOptions);
    });

    it('should return empty list when no jobs exist', async () => {
      const page = 1;
      const limit = 10;
      const expectedOptions = { page, limit };

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
      expect(mockVideoService.findAll).toHaveBeenCalledWith(expectedOptions);
    });

    it('should use default values when no pagination params are provided', async () => {
      const expectedOptions = { page: 1, limit: 10 };
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

      const result = await controller.findAll();

      expect(result).toEqual(mockPaginatedResult);
      expect(mockVideoService.findAll).toHaveBeenCalledWith(expectedOptions);
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

  describe('findByStatus', () => {
    it('should return paginated video jobs by status and userId', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = 'user-123';
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

      mockVideoService.findByStatus.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findByStatus(status, userId, page, limit);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockVideoService.findByStatus).toHaveBeenCalledWith(
        status,
        userId,
        { page, limit },
      );
    });

    it('should use default pagination values when not provided', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = 'user-123';

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

      mockVideoService.findByStatus.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findByStatus(status, userId);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockVideoService.findByStatus).toHaveBeenCalledWith(
        status,
        userId,
        { page: 1, limit: 10 },
      );
    });

    it('should throw BadRequestException for invalid page number', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = 'user-123';
      const page = 0;
      const limit = 10;

      await expect(
        controller.findByStatus(status, userId, page, limit),
      ).rejects.toThrow(BadRequestException);
      expect(mockVideoService.findByStatus).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid limit', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = 'user-123';
      const page = 1;
      const limit = 0;

      await expect(
        controller.findByStatus(status, userId, page, limit),
      ).rejects.toThrow(BadRequestException);
      expect(mockVideoService.findByStatus).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is not provided', async () => {
      const status = VideoJobStatus.PROCESSING;
      const userId = '';
      const page = 1;
      const limit = 10;

      await expect(
        controller.findByStatus(status, userId, page, limit),
      ).rejects.toThrow(BadRequestException);
      expect(mockVideoService.findByStatus).not.toHaveBeenCalled();
    });
  });
});
