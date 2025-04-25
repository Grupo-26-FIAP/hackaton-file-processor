import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class FileProcessMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  userId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'A lista deve conter pelo menos um arquivo' })
  @IsNotEmpty({ message: 'A lista de arquivos é obrigatória' })
  @Matches(
    /^https?:\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/,
    {
      each: true,
      message: 'Cada item da lista deve ser uma URL válida',
    },
  )
  filesUploadedKeys: string[];
}
