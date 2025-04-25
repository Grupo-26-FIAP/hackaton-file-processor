import { runMigrations } from 'src/database/run-migrations';
import { DataSource } from 'typeorm';

jest.mock('typeorm', () => {
  const mockDataSource = {
    initialize: jest.fn(),
    runMigrations: jest.fn(),
    destroy: jest.fn(),
  };

  return {
    DataSource: jest.fn().mockImplementation(() => mockDataSource),
  };
});

describe('run-migrations', () => {
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockDataSource = new DataSource({} as any) as jest.Mocked<DataSource>;
    (DataSource as jest.Mock).mockImplementation(() => mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar as migrações com sucesso', async () => {
    mockDataSource.initialize.mockResolvedValueOnce(undefined);
    mockDataSource.runMigrations.mockResolvedValueOnce([]);
    mockDataSource.destroy.mockResolvedValueOnce(undefined);

    await runMigrations();

    expect(mockDataSource.initialize).toHaveBeenCalled();
    expect(mockDataSource.runMigrations).toHaveBeenCalled();
    expect(mockDataSource.destroy).toHaveBeenCalled();
  });

  it('deve lidar com erro durante a inicialização', async () => {
    const error = new Error('Erro de inicialização');
    mockDataSource.initialize.mockRejectedValueOnce(error);

    const consoleSpy = jest.spyOn(console, 'error');
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    await runMigrations();

    expect(consoleSpy).toHaveBeenCalledWith('Error during migration:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockDataSource.runMigrations).not.toHaveBeenCalled();
    expect(mockDataSource.destroy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('deve lidar com erro durante a execução das migrações', async () => {
    const error = new Error('Erro nas migrações');
    mockDataSource.initialize.mockResolvedValueOnce(undefined);
    mockDataSource.runMigrations.mockRejectedValueOnce(error);

    const consoleSpy = jest.spyOn(console, 'error');
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    await runMigrations();

    expect(consoleSpy).toHaveBeenCalledWith('Error during migration:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockDataSource.destroy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('deve lidar com erro durante o fechamento da conexão', async () => {
    const error = new Error('Erro ao fechar conexão');
    mockDataSource.initialize.mockResolvedValueOnce(undefined);
    mockDataSource.runMigrations.mockResolvedValueOnce([]);
    mockDataSource.destroy.mockRejectedValueOnce(error);

    const consoleSpy = jest.spyOn(console, 'error');
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    await runMigrations();

    expect(consoleSpy).toHaveBeenCalledWith('Error during migration:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
