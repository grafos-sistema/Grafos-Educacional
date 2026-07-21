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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, ClassResponseDto } from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';
import { ClassSubjectsService } from '../class-subjects/class-subjects.service';
import { CreateClassSubjectDto } from '../class-subjects/dto';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateEnrollmentDto } from '../enrollments/dto';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly classSubjectsService: ClassSubjectsService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Criar nova turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem criar turmas em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Turma criada com sucesso',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todas as turmas',
    description: 'Lista turmas com paginação e filtros',
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
    name: 'courseId',
    required: false,
    type: String,
    description: 'Filtrar por curso',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'academicYearId',
    required: false,
    type: String,
    description: 'Filtrar por ano letivo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'grade',
    required: false,
    type: String,
    description: 'Filtrar por série/ano',
    example: '1º Ano',
  })
  @ApiQuery({
    name: 'shift',
    required: false,
    type: String,
    description: 'Filtrar por turno',
    example: 'Matutino',
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
    description: 'Lista de turmas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ClassResponseDto' },
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
    @Query('institutionId') institutionId?: string,
    @Query('courseId') courseId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('grade') grade?: string,
    @Query('shift') shift?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.classesService.findAll(
      page,
      limit,
      institutionId,
      courseId,
      academicYearId,
      grade,
      shift,
      isActive,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar turma por ID',
    description:
      'Retorna detalhes completos da turma incluindo curso, ano letivo e professor coordenador',
  })
  @ApiResponse({
    status: 200,
    description: 'Turma encontrada',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/students')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar alunos matriculados na turma',
    description: 'Retorna lista de alunos ativamente matriculados na turma',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          enrollmentId: { type: 'string' },
          enrollmentDate: { type: 'string', format: 'date-time' },
          student: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  findStudents(@Param('id') id: string) {
    return this.classesService.findStudents(id);
  }

  @Get(':id/subjects')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar disciplinas da turma',
    description:
      'Retorna lista de disciplinas vinculadas à turma com professores responsáveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          weeklyHours: { type: 'number', nullable: true },
          subject: { type: 'object' },
          teacher: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  findSubjects(@Param('id') id: string) {
    return this.classesService.findSubjects(id);
  }

  @Get(':id/schedule')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar grade horária da turma',
    description: 'Retorna grade horária completa da turma organizada por dia e horário',
  })
  @ApiResponse({
    status: 200,
    description: 'Grade horária retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          dayOfWeek: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          room: { type: 'string', nullable: true },
          subject: { type: 'object' },
          teacher: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  findSchedule(@Param('id') id: string) {
    return this.classesService.findSchedule(id);
  }

  @Get(':id/enrollments')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar matrículas da turma',
    description: 'Retorna lista de matrículas da turma (alias para /classes/:id/students)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de matrículas retornada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  findEnrollments(@Param('id') id: string) {
    return this.classesService.findStudents(id);
  }

  @Post(':classId/subjects')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Adicionar disciplina à turma',
    description:
      'Endpoint conveniente para adicionar disciplina a uma turma específica',
  })
  @ApiResponse({
    status: 201,
    description: 'Disciplina adicionada à turma com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Turma, disciplina ou professor não encontrado' })
  @ApiResponse({ status: 409, description: 'Disciplina já vinculada a esta turma' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  addSubject(
    @Param('classId') classId: string,
    @Body() body: Omit<CreateClassSubjectDto, 'classId'>,
  ) {
    return this.classSubjectsService.create({ ...body, classId });
  }

  @Post(':classId/enrollments')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Matricular aluno na turma',
    description:
      'Endpoint conveniente para matricular aluno em uma turma específica',
  })
  @ApiResponse({
    status: 201,
    description: 'Aluno matriculado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Turma ou aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Aluno já matriculado nesta turma' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  enrollStudent(
    @Param('classId') classId: string,
    @Body() body: Omit<CreateEnrollmentDto, 'classId'>,
  ) {
    return this.enrollmentsService.create({ ...body, classId });
  }

  @Delete(':classId/enrollments/:studentId')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Remover matrícula do aluno',
    description:
      'Remove a matrícula de um aluno específico da turma',
  })
  @ApiResponse({
    status: 200,
    description: 'Matrícula removida com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async removeEnrollment(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    // Buscar a matrícula
    const enrollments = await this.enrollmentsService.findAll(
      1,
      1,
      classId,
      studentId,
      undefined,
      true,
    );

    if (!enrollments.data || enrollments.data.length === 0) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    const enrollment = enrollments.data[0];
    return this.enrollmentsService.remove(enrollment.id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Atualizar turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem atualizar turmas de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover turma (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover turmas. Não permite remoção se houver matrículas ativas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Turma removida com sucesso',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover turma com matrículas ativas',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
