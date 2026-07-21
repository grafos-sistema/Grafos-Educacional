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
import { EnrollmentsService } from './enrollments.service';
import {
  CreateEnrollmentDto,
  TransferEnrollmentDto,
  EnrollmentResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Matricular aluno em turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem matricular alunos em turmas',
  })
  @ApiResponse({
    status: 201,
    description: 'Matrícula criada com sucesso',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Aluno já está matriculado nesta turma',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todas as matrículas',
    description: 'Lista matrículas com paginação e filtros',
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
    name: 'studentId',
    required: false,
    type: String,
    description: 'Filtrar por aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    type: String,
    description: 'Filtrar por instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
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
    description: 'Lista de matrículas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnrollmentResponseDto' },
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
    @Query('studentId') studentId?: string,
    @Query('institutionId') institutionId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.enrollmentsService.findAll(
      page,
      limit,
      classId,
      studentId,
      institutionId,
      isActive,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar matrícula por ID',
    description: 'Retorna detalhes completos da matrícula incluindo turma e aluno',
  })
  @ApiResponse({
    status: 200,
    description: 'Matrícula encontrada',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id/transfer')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Transferir aluno para outra turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem transferir alunos entre turmas. A matrícula atual é desativada e uma nova matrícula é criada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno transferido com sucesso',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Aluno já está matriculado na nova turma',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  transfer(
    @Param('id') id: string,
    @Body() transferDto: TransferEnrollmentDto,
  ) {
    return this.enrollmentsService.transfer(id, transferDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Cancelar matrícula (soft delete)',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem cancelar matrículas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Matrícula cancelada com sucesso',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }
}
