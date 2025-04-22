import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { VideoJob } from '../../../../src/database/entities/video-job.entity';
import { VideoJobStatus } from '../../../../src/database/enums/video-job-status.enum';
import { VideoRepository } from '../../../../src/modules/video/repositories/video.repository';

// Mock do módulo nestjs-typeorm-paginate
jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn().mockImplementation(async (queryBuilder, options) => ({
    items: [
      {
        id: '1',
        userId: 'user-123',
        jobId: 'job-123',
        status: 'processing',
        inputBucket: 'test-bucket',
        inputKey: 'test-key.mp4',
        outputBucket: 'output-bucket',
        outputKey: 'output-key.zip',
        error: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    meta: {
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: options.limit,
      totalPages: 1,
      currentPage: options.page,
    },
  })),
}));

describe('VideoRepository', () => {
  let repository: VideoRepository;

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

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    cache: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
    getMany: jest.fn().mockResolvedValue([mockVideoJob]),
    getManyAndCount: jest.fn().mockResolvedValue([[mockVideoJob], 1]),
  };

  const mockTypeormRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoRepository,
        {
          provide: getRepositoryToken(VideoJob),
          useValue: mockTypeormRepository,
        },
      ],
    }).compile();

    repository = module.get<VideoRepository>(VideoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVideoJob', () => {
    it('should create a new video job', async () => {
      const createData = {
        userId: 'user-123',
        jobId: 'job-123',
        status: VideoJobStatus.PROCESSING,
        inputBucket: 'test-bucket',
        inputKey: 'test-key.mp4',
      };

      mockTypeormRepository.create.mockReturnValue(mockVideoJob);
      mockTypeormRepository.save.mockResolvedValue(mockVideoJob);

      const result = await repository.createVideoJob(createData);

      expect(result).toEqual(mockVideoJob);
      expect(mockTypeormRepository.create).toHaveBeenCalledWith(createData);
      expect(mockTypeormRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated video jobs', async () => {
      const options: IPaginationOptions = {
        page: 1,
        limit: 10,
      };

      const result = await repository.findAll(options);

      expect(result.items).toHaveLength(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(10);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'video',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'video.createdAt',
        'DESC',
      );
    });
  });

  describe('findVideoJobById', () => {
    it('should return a video job by id', async () => {
      const id = '1';
      mockTypeormRepository.findOne.mockResolvedValue(mockVideoJob);

      const result = await repository.findVideoJobById(id);

      expect(result).toEqual(mockVideoJob);
      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null if video job not found', async () => {
      const id = '999';
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findVideoJobById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateVideoJob', () => {
    it('should update video job', async () => {
      const id = '1';
      const updateData = { status: VideoJobStatus.COMPLETED };
      const updatedJob = { ...mockVideoJob, ...updateData };

      mockTypeormRepository.update.mockResolvedValue({ affected: 1 });
      mockTypeormRepository.findOne.mockResolvedValue(updatedJob);

      const result = await repository.updateVideoJob(id, updateData);

      expect(result).toEqual(updatedJob);
      expect(mockTypeormRepository.update).toHaveBeenCalledWith(id, updateData);
      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return paginated video jobs by status', async () => {
      const status = VideoJobStatus.PROCESSING;
      const options: IPaginationOptions = {
        page: 1,
        limit: 10,
      };

      const result = await repository.findByStatus(status, options);

      expect(result.items).toHaveLength(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(10);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'video',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'video.status = :status',
        { status },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'video.createdAt',
        'DESC',
      );
    });
  });
});
