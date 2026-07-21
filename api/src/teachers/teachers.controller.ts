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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherResponseDto } from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { TeacherGuard } from '../auth/guards/teacher.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Criar novo professor',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem criar professores em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Professor criado com sucesso',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe registro de professor para este usuário',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os professores',
    description: 'Lista professores com paginação e filtros',
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
    description: 'Busca por nome, email, registro ou especialização',
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
    description: 'Lista de professores retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TeacherResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 3 },
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
    return this.teachersService.findAll(
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
    summary: 'Buscar professor por ID',
    description: 'Retorna detalhes completos do professor',
  })
  @ApiResponse({
    status: 200,
    description: 'Professor encontrado',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Get(':id/classes')
  @UseGuards(TeacherGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({
    summary: 'Listar turmas do professor',
    description: 'Retorna todas as turmas que o professor leciona',
  })
  @ApiResponse({
    status: 200,
    description: 'Turmas do professor retornadas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
          academicYear: { type: 'object' },
          course: { type: 'object' },
          subject: { type: 'object' },
          _count: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  findClasses(@Param('id') id: string) {
    return this.teachersService.findClasses(id);
  }

  @Get(':id/subjects')
  @UseGuards(TeacherGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({
    summary: 'Listar disciplinas do professor',
    description: 'Retorna todas as disciplinas que o professor está habilitado a lecionar',
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplinas do professor retornadas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  findSubjects(@Param('id') id: string) {
    return this.teachersService.findSubjects(id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Atualizar professor',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem atualizar professores de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Professor atualizado com sucesso',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover professor (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover professores. Não permite remoção se houver turmas ativas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Professor removido com sucesso',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover professor com turmas ativas',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
