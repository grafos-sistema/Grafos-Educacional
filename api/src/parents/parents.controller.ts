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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import {
  CreateParentDto,
  UpdateParentDto,
  LinkStudentDto,
  ParentResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { ParentGuard } from '../auth/guards/parent.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('parents')
@ApiBearerAuth()
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Criar novo responsável',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem criar responsáveis em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Responsável criado com sucesso',
    type: ParentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe registro de responsável para este usuário',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.create(createParentDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os responsáveis',
    description: 'Lista responsáveis com paginação e filtros',
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
    description: 'Busca por nome, email ou profissão',
    example: 'João',
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
    description: 'Lista de responsáveis retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ParentResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 8 },
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
    return this.parentsService.findAll(
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
    summary: 'Buscar responsável por ID',
    description: 'Retorna detalhes completos do responsável incluindo alunos vinculados',
  })
  @ApiResponse({
    status: 200,
    description: 'Responsável encontrado',
    type: ParentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Responsável não encontrado' })
  findOne(@Param('id') id: string) {
    return this.parentsService.findOne(id);
  }

  @Get(':id/students')
  @UseGuards(ParentGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Listar filhos/alunos do responsável',
    description:
      'Retorna todos os alunos vinculados ao responsável. Responsáveis só podem ver seus próprios filhos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Alunos do responsável retornados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          enrollmentNumber: { type: 'string' },
          user: { type: 'object' },
          linkedAt: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Responsável não encontrado' })
  findStudents(@Param('id') id: string) {
    return this.parentsService.findStudents(id);
  }

  @Post(':id/students')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vincular aluno ao responsável',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem vincular alunos aos responsáveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno vinculado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Aluno vinculado com sucesso' },
        parentId: { type: 'string' },
        studentId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Responsável ou aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Aluno já está vinculado a este responsável' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  linkStudent(
    @Param('id') id: string,
    @Body() linkStudentDto: LinkStudentDto,
  ) {
    return this.parentsService.linkStudent(id, linkStudentDto);
  }

  @Delete(':id/students/:studentId')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Remover vinculação de aluno',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem remover vinculação entre responsável e aluno',
  })
  @ApiResponse({
    status: 200,
    description: 'Vinculação removida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Vinculação removida com sucesso' },
        parentId: { type: 'string' },
        studentId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Vinculação não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  unlinkStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentsService.unlinkStudent(id, studentId);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Atualizar responsável',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem atualizar responsáveis de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Responsável atualizado com sucesso',
    type: ParentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Responsável não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto) {
    return this.parentsService.update(id, updateParentDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover responsável (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover responsáveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Responsável removido com sucesso',
    type: ParentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Responsável não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.parentsService.remove(id);
  }
}
