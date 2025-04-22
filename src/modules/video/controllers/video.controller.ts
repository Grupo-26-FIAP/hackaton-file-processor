import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../../core/interceptors/response.interceptor';
import { VideoJobStatus } from '../../../database/enums/video-job-status.enum';
import { CreateVideoJobDto } from '../dto/create-video-job.dto';
import { VideoJobDto } from '../dto/video-job.dto';
import { VideoService } from '../services/video.service';

@ApiTags('Videos')
@Controller({ path: 'videos', version: '1' })
@UseInterceptors(ResponseInterceptor)
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly videoService: VideoService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar um novo job de processamento de vídeo',
    description: 'Cria um novo job para processar um vídeo armazenado no S3',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Job criado com sucesso',
    type: VideoJobDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos fornecidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async create(
    @Body() createVideoJobDto: CreateVideoJobDto,
  ): Promise<VideoJobDto> {
    this.logger.log(
      `Creating new video job for user ${createVideoJobDto.userId}`,
    );
    return await this.videoService.create(createVideoJobDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os jobs de vídeo',
    description: 'Retorna uma lista paginada de todos os jobs de vídeo',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de jobs retornada com sucesso',
    type: [VideoJobDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de paginação inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    this.logger.log('Retrieving all video jobs');
    return await this.videoService.findAll({ page, limit });
  }

  @Get('status/:status')
  @ApiOperation({
    summary: 'Listar jobs por status',
    description: 'Retorna uma lista paginada de jobs filtrados por status',
  })
  @ApiParam({
    name: 'status',
    enum: VideoJobStatus,
    description: 'Status do job (processing, completed, failed)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de jobs retornada com sucesso',
    type: [VideoJobDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Status inválido fornecido ou parâmetros de paginação inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async getByStatus(
    @Param('status') status: VideoJobStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    this.logger.log(`Retrieving video jobs with status: ${status}`);
    return await this.videoService.getByStatus(status, { page, limit });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar job por ID',
    description: 'Retorna um job de vídeo específico pelo ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job retornado com sucesso',
    type: VideoJobDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido fornecido',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async findOne(@Param('id') id: string): Promise<VideoJobDto> {
    if (!id) {
      throw new BadRequestException('ID must not be empty');
    }

    this.logger.log(`Retrieving video job with ID: ${id}`);
    return await this.videoService.findOne(id);
  }
}
