import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { ResponseInterceptor } from '../../../core/interceptors/response.interceptor';
import { VideoJobStatus } from '../../../database/enums/video-job-status.enum';
import { CreateVideoJobDto } from '../dto/create-video-job.dto';
import { VideoJobDto } from '../dto/video-job.dto';
import { VideoService } from '../services/video.service';

@ApiTags('Videos')
@Controller({ path: 'videos', version: '1' })
@ApiBearerAuth()
@UseInterceptors(ResponseInterceptor)
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly videoService: VideoService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new video job' })
  @ApiResponse({
    status: 201,
    description: 'The video job has been successfully created.',
    type: VideoJobDto,
  })
  async create(
    @Body() createVideoJobDto: CreateVideoJobDto,
  ): Promise<VideoJobDto> {
    return this.videoService.create(createVideoJobDto);
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
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de itens por página',
    example: 10,
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const options: IPaginationOptions = {
      page,
      limit,
    };
    return this.videoService.findAll(options);
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
    example: 'processing',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'ID do usuário para filtrar os jobs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de itens por página',
    example: 10,
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
  async findByStatus(
    @Param('status') status: VideoJobStatus,
    @Query('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    if (!userId) {
      throw new BadRequestException('UserId is required');
    }
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const options: IPaginationOptions = {
      page,
      limit,
    };
    return this.videoService.findByStatus(status, userId, options);
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
