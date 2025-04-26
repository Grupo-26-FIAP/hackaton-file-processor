import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VideoJobStatus } from '../enums/video-job-status.enum';

@Entity('video_jobs')
export class VideoJob {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'user_id',
    comment: 'ID do usuário que submeteu o job',
    type: 'varchar',
  })
  userId: string;

  @Column({
    name: 'job_id',
    unique: true,
    comment: 'Identificador único do job',
    generated: 'uuid',
    type: 'uuid',
  })
  jobId: string;

  @Column({
    type: 'enum',
    enum: VideoJobStatus,
    default: VideoJobStatus.PROCESSING,
    comment: 'Status atual do job (pending, processing, completed, failed)',
  })
  status: VideoJobStatus;

  @Column({
    name: 'input_bucket',
    nullable: true,
    comment: 'Bucket S3 contendo o vídeo de entrada',
  })
  inputBucket: string;

  @Column({
    name: 'input_key',
    nullable: true,
    comment: 'Chave S3 do vídeo de entrada',
  })
  inputKey: string;

  @Column({
    name: 'output_bucket',
    nullable: true,
    comment: 'Bucket S3 para o output processado',
  })
  outputBucket: string;

  @Column({
    name: 'output_key',
    nullable: true,
    comment: 'Chave S3 do output processado',
    type: 'text',
  })
  outputKey: string;

  @Column({
    nullable: true,
    comment: 'Mensagem de erro se o processamento falhar',
  })
  error?: string;

  @CreateDateColumn({
    name: 'created_at',
    comment: 'Data e hora de criação do job',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: 'Data e hora da última atualização do job',
  })
  updatedAt: Date;
}
