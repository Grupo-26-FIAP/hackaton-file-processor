// Mock das dependências globais
jest.mock('@nestjs/typeorm', () => ({
  getRepositoryToken: jest.fn(),
  InjectRepository: () => jest.fn(),
  TypeOrmModule: {
    forRoot: jest.fn(),
    forFeature: jest.fn(),
  },
}));

// Mock do path-scurry
jest.mock('path-scurry', () => ({
  PathScurry: jest.fn().mockImplementation(() => ({
    native: jest.fn(),
  })),
}));

const mockDecorator = () => {
  return () => {
    return;
  };
};

// Mock TypeORM decorators
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    Entity: mockDecorator,
    Column: mockDecorator,
    PrimaryGeneratedColumn: mockDecorator,
    CreateDateColumn: mockDecorator,
    UpdateDateColumn: mockDecorator,
    OneToMany: mockDecorator,
    ManyToOne: mockDecorator,
    JoinColumn: mockDecorator,
    Repository: jest.fn(),
    getRepository: jest.fn(),
    FindOneOptions: jest.fn(),
    UpdateResult: jest.fn(),
  };
});

// Mock nestjs-typeorm-paginate
jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
  IPaginationOptions: jest.fn(),
}));

// Mock class para repositórios
class MockRepository {
  constructor() {
    this.createQueryBuilder = jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    }));

    this.find = jest.fn();
    this.findOne = jest.fn();
    this.save = jest.fn();
    this.update = jest.fn();
    this.delete = jest.fn();
    this.count = jest.fn();
    this.create = jest.fn();
  }
}

global.MockRepository = MockRepository;
