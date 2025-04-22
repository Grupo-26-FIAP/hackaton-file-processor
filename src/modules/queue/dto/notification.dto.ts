import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class NotificationDto {
  @ApiProperty({
    description: 'Mensagem a ser enviada como notificação',
    example: 'Seu processamento de vídeo foi concluído com sucesso',
    maxLength: 1000,
  })
  @IsString({ message: 'A mensagem deve ser uma string' })
  @IsNotEmpty({ message: 'A mensagem não pode estar vazia' })
  @MaxLength(1000, {
    message: 'A mensagem não pode ter mais de 1000 caracteres',
  })
  message: string;

  constructor(partial?: Partial<NotificationDto>) {
    if (partial) {
      Object.assign(this, partial);
      if (typeof this.message === 'string') {
        this.message = this.message.trim();
      }
    }
  }
}
