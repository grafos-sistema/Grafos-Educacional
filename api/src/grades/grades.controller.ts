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
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GradesService } from './grades.service';
import {
  CreateGradeDto,
  BulkGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
} from './dto';
import { UserRole, GradeStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Lançar nota individual',
    description: 'TEACHER pode lançar nota de um aluno',
  })
  @ApiResponse({
    status: 201,
    description: 'Nota lançada com sucesso',
    type: GradeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Post('bulk')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Lançar notas em lote',
    description:
      'TEACHER pode lançar notas de múltiplos alunos de uma vez para a mesma avaliação',
  })
  @ApiResponse({
    status: 201,
    description: 'Notas lançadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 25 },
        grades: {
          type: 'array',
          items: { $ref: '#/components/schemas/GradeResponseDto' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  createBulk(@Body() bulkGradeDto: BulkGradeDto) {
    return this.gradesService.createBulk(bulkGradeDto);
  }

  @Get()
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({
    summary: 'Listar notas',
    description: 'Lista notas com paginação e filtros',
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
    name: 'studentId',
    required: false,
    type: String,
    description: 'Filtrar por aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'classSubjectId',
    required: false,
    type: String,
    description: 'Filtrar por disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'academicPeriodId',
    required: false,
    type: String,
    description: 'Filtrar por período letivo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: GradeStatus,
    description: 'Filtrar por status',
    example: GradeStatus.PUBLISHED,
  })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
    description: 'Filtrar por professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/GradeResponseDto' },
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
    @Query('studentId') studentId?: string,
    @Query('classSubjectId') classSubjectId?: string,
    @Query('academicPeriodId') academicPeriodId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: GradeStatus,
  ) {
    return this.gradesService.findAll(
      page,
      limit,
      studentId,
      classSubjectId,
      academicPeriodId,
      teacherId,
      status,
    );
  }

  @Get('student/:studentId')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiParam({
    name: 'studentId',
    description: 'ID do aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar notas do aluno com médias',
    description:
      'Retorna todas as notas do aluno com cálculo de médias ponderadas por disciplina e período',
  })
  @ApiResponse({
    status: 200,
    description: 'Notas do aluno retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        student: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            enrollmentNumber: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        gradesBySubjectPeriod: {
          type: 'array',
          description: 'Notas agrupadas por disciplina e período com médias',
        },
        allGrades: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.gradesService.findByStudent(studentId);
  }

  @Get(':id')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiParam({
    name: 'id',
    description: 'ID da nota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar nota por ID',
    description: 'Retorna detalhes completos da nota',
  })
  @ApiResponse({
    status: 200,
    description: 'Nota encontrada',
    type: GradeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Nota não encontrada' })
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID da nota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Atualizar nota',
    description: 'TEACHER pode atualizar nota',
  })
  @ApiResponse({
    status: 200,
    description: 'Nota atualizada com sucesso',
    type: GradeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Nota não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Patch(':id/publish')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR)
  @ApiParam({
    name: 'id',
    description: 'ID da nota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Publicar nota',
    description:
      'TEACHER e COORDINATOR podem publicar nota, tornando-a visível para alunos e pais',
  })
  @ApiResponse({
    status: 200,
    description: 'Nota publicada com sucesso',
    type: GradeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Nota já foi publicada' })
  @ApiResponse({ status: 404, description: 'Nota não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  publish(@Param('id') id: string) {
    return this.gradesService.publish(id);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR)
  @ApiParam({
    name: 'id',
    description: 'ID da nota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Remover nota',
    description: 'TEACHER e COORDINATOR podem remover nota',
  })
  @ApiResponse({
    status: 200,
    description: 'Nota removida com sucesso',
    type: GradeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Nota não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id);
  }

  @Get('class-subject/:classSubjectId')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(333300) // 5 minutos em milissegundos
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @SkipOwnership()
  @ApiParam({
    name: 'classSubjectId',
    description: 'ID da turma/disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar notas de uma turma/disciplina',
    description: 'Retorna todas as notas de uma turma específica em uma disciplina',
  })
  @ApiResponse({
    status: 200,
    description: 'Notas retornadas com sucesso',
    type: [GradeResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Turma/disciplina não encontrada' })
  async getClassSubjectGrades(@Param('classSubjectId') classSubjectId: string) {
    return this.gradesService.findAll(
      1,              // page
      1000,           // limit - retornar todas
      undefined,      // studentId
      classSubjectId, // classSubjectId
      undefined,      // academicPeriodId
      undefined,      // teacherId
      undefined,      // status
    );
  }
}
