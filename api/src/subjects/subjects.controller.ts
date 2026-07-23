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
import { SubjectsService } from './subjects.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Criar nova disciplina',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem criar disciplinas em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Disciplina criada com sucesso',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe disciplina com este código na instituição',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todas as disciplinas',
    description: 'Lista disciplinas com paginação e filtros',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por nome, código ou descrição',
    example: 'Matemática',
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
    description: 'Lista de disciplinas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SubjectResponseDto' },
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
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.subjectsService.findAll(
      page,
      limit,
      institutionId,
      courseId,
      search,
      isActive,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar disciplina por ID',
    description: 'Retorna detalhes completos da disciplina incluindo cursos e professores',
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina encontrada',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Disciplina não encontrada' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Atualizar disciplina',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem atualizar disciplinas de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina atualizada com sucesso',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Disciplina não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Já existe disciplina com este código na instituição',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover disciplina (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover disciplinas. Não permite remoção se houver turmas ativas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida com sucesso',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Disciplina não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover disciplina com turmas ativas',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }

  @Delete(':id/permanent')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Excluir disciplina permanentemente',
    description:
      'Apenas SUPER_ADMIN pode excluir permanentemente uma disciplina, removendo os vinculos em cascata e preservando referencias opcionais com null',
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina excluida permanentemente com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Disciplina excluida permanentemente com sucesso',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Disciplina não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  removePermanently(@Param('id') id: string) {
    return this.subjectsService.removePermanently(id);
  }
}
