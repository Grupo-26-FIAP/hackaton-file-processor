// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SanitizeInterceptor } from './core/interceptors/sanitize.interceptor';
import { VideoJob } from './database/entities/video-job.entity';
import { QueueModule } from './modules/queue/queue.module';
import { VideoModule } from './modules/video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'video_processor',
      entities: [VideoJob],
      autoLoadEntities: true,
      migrationsRun: true,
      synchronize: true,
      retryAttempts: 5,
      retryDelay: 3000,
      ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
    }),
    QueueModule,
    VideoModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeInterceptor,
    },
  ],
})
export class AppModule {}
