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
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, StudentResponseDto } from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { StudentGuard } from '../auth/guards/student.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Criar novo aluno',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem criar alunos em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Aluno criado com sucesso',
    type: StudentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe registro de aluno para este usuário ou número de matrícula em uso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os alunos',
    description: 'Lista alunos com paginação e filtros',
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
    name: 'institutionId',
    required: false,
    type: String,
    description: 'Filtrar por instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por nome, email ou matrícula',
    example: 'Maria',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo/inativo',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/StudentResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 200 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 10 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('institutionId') institutionId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.studentsService.findAll(
      page,
      limit,
      institutionId,
      search,
      isActive,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar aluno por ID',
    description: 'Retorna detalhes completos do aluno incluindo pais/responsáveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno encontrado',
    type: StudentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/grades')
  @UseGuards(StudentGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Listar notas do aluno',
    description:
      'Retorna todas as notas do aluno. Alunos só podem ver suas próprias notas.',
  })
  @ApiQuery({
    name: 'academicYearId',
    required: false,
    type: String,
    description: 'Filtrar por ano acadêmico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notas do aluno retornadas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          grade: { type: 'number' },
          weight: { type: 'number' },
          notes: { type: 'string' },
          class: { type: 'object' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  findGrades(
    @Param('id') id: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.studentsService.findGrades(id, academicYearId);
  }

  @Get(':id/attendances')
  @UseGuards(StudentGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Listar frequências do aluno',
    description:
      'Retorna todas as frequências do aluno. Alunos só podem ver suas próprias frequências.',
  })
  @ApiQuery({
    name: 'academicYearId',
    required: false,
    type: String,
    description: 'Filtrar por ano acadêmico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequências do aluno retornadas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          date: { type: 'string' },
          status: { type: 'string' },
          notes: { type: 'string' },
          class: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  findAttendances(
    @Param('id') id: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.studentsService.findAttendances(id, academicYearId);
  }

  @Get(':id/report')
  @UseGuards(StudentGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Gerar relatório de desempenho do aluno',
    description:
      'Retorna estatísticas completas incluindo média de notas e taxa de presença por disciplina. Alunos só podem ver seu próprio relatório.',
  })
  @ApiQuery({
    name: 'academicYearId',
    required: false,
    type: String,
    description: 'Filtrar por ano acadêmico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        student: { type: 'object' },
        overall: {
          type: 'object',
          properties: {
            averageGrade: { type: 'number' },
            attendanceRate: { type: 'number' },
            totalEnrollments: { type: 'number' },
          },
        },
        performanceByClass: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              class: { type: 'object' },
              statistics: {
                type: 'object',
                properties: {
                  totalGrades: { type: 'number' },
                  averageGrade: { type: 'number' },
                  totalClasses: { type: 'number' },
                  presentClasses: { type: 'number' },
                  attendanceRate: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  getReport(
    @Param('id') id: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.studentsService.getReport(id, academicYearId);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Atualizar aluno',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem atualizar alunos de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno atualizado com sucesso',
    type: StudentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Número de matrícula já está em uso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover aluno (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover alunos. Não permite remoção se houver matrículas ativas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno removido com sucesso',
    type: StudentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover aluno com matrículas ativas',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
