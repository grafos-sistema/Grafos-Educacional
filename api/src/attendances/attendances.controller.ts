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
import { AttendancesService } from './attendances.service';
import {
  CreateAttendanceDto,
  BulkAttendanceDto,
  UpdateAttendanceDto,
  AttendanceResponseDto,
} from './dto';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('attendances')
@ApiBearerAuth()
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Registrar frequência individual',
    description: 'TEACHER pode registrar frequência de aluno individualmente',
  })
  @ApiResponse({
    status: 201,
    description: 'Frequência registrada com sucesso',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe registro de frequência para esta data',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Post('bulk')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Registrar frequência em lote',
    description:
      'TEACHER pode registrar frequência de múltiplos alunos de uma vez para a mesma aula',
  })
  @ApiResponse({
    status: 201,
    description: 'Frequências registradas com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 25 },
        attendances: {
          type: 'array',
          items: { $ref: '#/components/schemas/AttendanceResponseDto' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existem registros de frequência para esta data',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  createBulk(@Body() bulkAttendanceDto: BulkAttendanceDto) {
    return this.attendancesService.createBulk(bulkAttendanceDto);
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
    summary: 'Listar frequências',
    description: 'Lista frequências com paginação e filtros',
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
    name: 'classId',
    required: false,
    type: String,
    description: 'Filtrar por turma',
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
    name: 'studentId',
    required: false,
    type: String,
    description: 'Filtrar por aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filtrar por data específica',
    example: '2024-01-20',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial (período)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final (período)',
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AttendanceStatus,
    description: 'Filtrar por status',
    example: AttendanceStatus.PRESENT,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de frequências retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AttendanceResponseDto' },
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
    @Query('classId') classId?: string,
    @Query('classSubjectId') classSubjectId?: string,
    @Query('studentId') studentId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    return this.attendancesService.findAll(
      page,
      limit,
      classId,
      classSubjectId,
      studentId,
      date,
      startDate,
      endDate,
      status,
    );
  }

  @Get('student/:studentId/history')
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
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Mês (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano',
  })
  @ApiQuery({
    name: 'classSubjectId',
    required: false,
    type: String,
    description: 'ID da disciplina',
  })
  @ApiOperation({
    summary: 'Histórico de frequência do aluno',
    description:
      'Retorna histórico detalhado de frequência do aluno com filtros de mês/ano e disciplina',
  })
  async getStudentHistory(
    @Param('studentId') studentId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('classSubjectId') classSubjectId?: string,
  ) {
    return await this.attendancesService.getStudentHistory(studentId, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      classSubjectId,
    });
  }

  @Get('report/:studentId')
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
    summary: 'Relatório de frequência do aluno',
    description:
      'Retorna relatório completo de frequência do aluno com estatísticas gerais e por disciplina',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
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
        overall: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            present: { type: 'number' },
            absent: { type: 'number' },
            late: { type: 'number' },
            excused: { type: 'number' },
            attendanceRate: { type: 'number' },
          },
        },
        bySubject: { type: 'array' },
        recentAttendances: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  getStudentReport(@Param('studentId') studentId: string) {
    return this.attendancesService.getStudentReport(studentId);
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
    description: 'ID do registro de frequência',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar frequência por ID',
    description: 'Retorna detalhes completos do registro de frequência',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequência encontrada',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Frequência não encontrada' })
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID do registro de frequência',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Atualizar frequência',
    description: 'TEACHER pode atualizar status e observações da frequência',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequência atualizada com sucesso',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Frequência não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID do registro de frequência',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Remover frequência',
    description: 'TEACHER pode remover registro de frequência',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequência removida com sucesso',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Frequência não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }

  @Get('class-subject/:classSubjectId')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000) // 1 minuto em milissegundos (reduzido para evitar dados desatualizados)
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @SkipOwnership()
  @ApiParam({
    name: 'classSubjectId',
    description: 'ID da turma/disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar frequências de uma turma/disciplina',
    description: 'Retorna todas as frequências de uma turma específica em uma disciplina',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequências retornadas com sucesso',
    type: [AttendanceResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Turma/disciplina não encontrada' })
  async getClassSubjectAttendances(@Param('classSubjectId') classSubjectId: string) {
    return this.attendancesService.findAll(
      1,              // page
      1000,           // limit - retornar todas
      undefined,      // classId
      classSubjectId, // classSubjectId
    );
  }
}
