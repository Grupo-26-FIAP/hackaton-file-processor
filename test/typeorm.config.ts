import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { VideoJob } from '../src/database/entities/video-job.entity';

export const typeOrmTestConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'video_processor_test',
  entities: [VideoJob],
  synchronize: true,
  dropSchema: true,
};
