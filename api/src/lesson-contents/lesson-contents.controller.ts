import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LessonContentsService } from './lesson-contents.service';
import {
  CreateLessonContentDto,
  UpdateLessonContentDto,
  LessonContentResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('lesson-contents')
@ApiBearerAuth()
@Controller('lesson-contents')
export class LessonContentsController {
  constructor(private readonly lessonContentsService: LessonContentsService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Registrar conteúdo de aula',
    description: 'TEACHER pode registrar o conteúdo ministrado em uma aula',
  })
  @ApiResponse({
    status: 201,
    description: 'Conteúdo de aula registrado com sucesso',
    type: LessonContentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createLessonContentDto: CreateLessonContentDto) {
    return this.lessonContentsService.create(createLessonContentDto);
  }

  @Get()
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  @ApiOperation({
    summary: 'Listar conteúdos de aula',
    description: 'Lista conteúdos de aula com paginação e filtros',
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
    description: 'Itens por página',
    example: 20,
  })
  @ApiQuery({
    name: 'classSubjectId',
    required: false,
    type: String,
    description: 'Filtrar por disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
    description: 'Filtrar por professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filtrar por data inicial',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filtrar por data final',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conteúdos de aula retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/LessonContentResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 20 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 1 },
            hasNextPage: { type: 'boolean', example: false },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('classSubjectId') classSubjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.lessonContentsService.findAll(
      page,
      limit,
      classSubjectId,
      teacherId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  @ApiParam({
    name: 'id',
    description: 'ID do conteúdo de aula',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar conteúdo de aula por ID',
    description: 'Retorna detalhes completos do conteúdo de aula',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo de aula encontrado',
    type: LessonContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conteúdo de aula não encontrado' })
  findOne(@Param('id') id: string) {
    return this.lessonContentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID do conteúdo de aula',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Atualizar conteúdo de aula',
    description: 'TEACHER pode atualizar o conteúdo de aula',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo de aula atualizado com sucesso',
    type: LessonContentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Conteúdo de aula não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateLessonContentDto: UpdateLessonContentDto,
  ) {
    return this.lessonContentsService.update(id, updateLessonContentDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID do conteúdo de aula',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Remover conteúdo de aula',
    description: 'TEACHER pode remover conteúdo de aula',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteúdo de aula removido com sucesso',
    type: LessonContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conteúdo de aula não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.lessonContentsService.remove(id);
  }
}
