// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoJob, VideoJobSchema } from './db/video-job.schema';
import { VideoJobService } from './db/video-job.service';
import { ProcessorService } from './processor/processor.service';
import { ConsumerService } from './queue/consumer.service';
import { NotifierProducerService } from './queue/notifier-producer.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: VideoJob.name, schema: VideoJobSchema },
    ]),
  ],
  providers: [
    ProcessorService,
    NotifierProducerService,
    ConsumerService,
    VideoJobService,
  ],
})
export class AppModule {}
