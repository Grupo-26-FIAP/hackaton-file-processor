import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Mensagem indicando o resultado do envio da notificação',
    example: 'Notificação enviada com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Data e hora do envio da notificação',
    example: '2023-04-22T12:00:00.000Z',
  })
  timestamp: string;

  constructor(partial?: Partial<NotificationResponseDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
