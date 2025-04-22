import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class CreateVideoJobDto {
  @ApiProperty({
    description: 'ID do usuário que está submetendo o job',
    example: 'user-123',
  })
  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'O ID do usuário deve conter apenas letras minúsculas, números e hífens',
  })
  userId: string;

  @ApiProperty({
    description: 'Nome do bucket S3 contendo o vídeo de entrada',
    example: 'my-video-bucket',
  })
  @IsNotEmpty({ message: 'O bucket de entrada é obrigatório' })
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'O nome do bucket deve conter apenas letras minúsculas, números e hífens',
  })
  inputBucket: string;

  @ApiProperty({
    description: 'Chave do objeto S3 contendo o vídeo de entrada',
    example: 'videos/input/my-video.mp4',
  })
  @IsNotEmpty({ message: 'A chave do vídeo de entrada é obrigatória' })
  @Matches(/^[a-z0-9-/_.]+$/, {
    message:
      'A chave do vídeo deve conter apenas letras minúsculas, números, hífens, underscores, pontos e barras',
  })
  inputKey: string;
}
