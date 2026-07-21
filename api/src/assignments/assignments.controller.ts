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
import { AssignmentsService } from './assignments.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  AssignmentResponseDto,
  SubmissionResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Criar tarefa/atividade',
    description: 'TEACHER pode criar tarefa para os alunos',
  })
  @ApiResponse({
    status: 201,
    description: 'Tarefa criada com sucesso',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsService.create(createAssignmentDto);
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
    summary: 'Listar tarefas',
    description: 'Lista tarefas com paginação e filtros',
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
    name: 'dueDateStart',
    required: false,
    type: String,
    description: 'Filtrar por data limite inicial',
    example: '2024-03-01',
  })
  @ApiQuery({
    name: 'dueDateEnd',
    required: false,
    type: String,
    description: 'Filtrar por data limite final',
    example: '2024-03-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AssignmentResponseDto' },
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
    @Query('dueDateStart') dueDateStart?: string,
    @Query('dueDateEnd') dueDateEnd?: string,
  ) {
    return this.assignmentsService.findAll(
      page,
      limit,
      classSubjectId,
      teacherId,
      dueDateStart,
      dueDateEnd,
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
    description: 'ID da tarefa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar tarefa por ID',
    description: 'Retorna detalhes completos da tarefa',
  })
  @ApiResponse({
    status: 200,
    description: 'Tarefa encontrada',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiParam({
    name: 'id',
    description: 'ID da tarefa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Submeter tarefa',
    description: 'STUDENT pode submeter resposta da tarefa',
  })
  @ApiResponse({
    status: 201,
    description: 'Tarefa submetida com sucesso',
    type: SubmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Aluno já submeteu esta tarefa',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  submit(
    @Param('id') id: string,
    @Body() submitDto: SubmitAssignmentDto,
  ) {
    return this.assignmentsService.submit(id, submitDto);
  }

  @Get(':id/submissions')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiParam({
    name: 'id',
    description: 'ID da tarefa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Listar submissões da tarefa',
    description:
      'TEACHER pode visualizar todas as submissões dos alunos para a tarefa',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de submissões retornada com sucesso',
    type: [SubmissionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  getSubmissions(@Param('id') id: string) {
    return this.assignmentsService.getSubmissions(id);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR)
  @ApiParam({
    name: 'submissionId',
    description: 'ID da submissão',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Corrigir submissão',
    description: 'TEACHER pode corrigir submissão do aluno e dar feedback',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissão corrigida com sucesso',
    type: SubmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Submissão não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() gradeDto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, gradeDto);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID da tarefa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Atualizar tarefa',
    description: 'TEACHER pode atualizar tarefa',
  })
  @ApiResponse({
    status: 200,
    description: 'Tarefa atualizada com sucesso',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR)
  @ApiParam({
    name: 'id',
    description: 'ID da tarefa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Remover tarefa',
    description: 'TEACHER e COORDINATOR podem remover tarefa',
  })
  @ApiResponse({
    status: 200,
    description: 'Tarefa removida com sucesso',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}
