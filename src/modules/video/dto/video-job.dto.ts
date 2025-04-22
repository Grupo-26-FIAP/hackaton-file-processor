import { ApiProperty } from '@nestjs/swagger';
import { VideoJobStatus } from 'src/database/enums/video-job-status.enum';
export class VideoJobDto {
  @ApiProperty({
    description: 'ID único do job de vídeo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário que submeteu o job',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Identificador único do job',
    example: 'job-123',
  })
  jobId: string;

  @ApiProperty({
    description: 'Bucket S3 contendo o vídeo de entrada',
    example: 'my-video-bucket',
  })
  inputBucket: string;

  @ApiProperty({
    description: 'Chave S3 do vídeo de entrada',
    example: 'videos/input/my-video.mp4',
  })
  inputKey: string;

  @ApiProperty({
    description: 'Bucket S3 para o output processado',
    example: 'my-processed-bucket',
  })
  outputBucket: string;

  @ApiProperty({
    description: 'Chave S3 do output processado',
    example: 'videos/output/my-video.zip',
  })
  outputKey: string;

  @ApiProperty({
    description: 'Status atual do job',
    enum: VideoJobStatus,
    example: VideoJobStatus.PROCESSING,
  })
  status: VideoJobStatus;

  @ApiProperty({
    description: 'Mensagem de erro se o processamento falhar',
    example: 'Falha ao processar o vídeo',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Data e hora de criação do job',
    example: '2024-03-10T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data e hora da última atualização do job',
    example: '2024-03-10T15:35:00.000Z',
  })
  updatedAt: Date;
}
