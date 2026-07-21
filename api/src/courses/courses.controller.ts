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
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Criar novo curso',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem criar cursos em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Curso criado com sucesso',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe curso com este código na instituição',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os cursos',
    description: 'Lista cursos com paginação e filtros',
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
    description: 'Busca por nome, código ou descrição',
    example: 'Fundamental',
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
    description: 'Lista de cursos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CourseResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 15 },
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
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.coursesService.findAll(
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
    summary: 'Buscar curso por ID',
    description: 'Retorna detalhes completos do curso incluindo disciplinas',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso encontrado',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Atualizar curso',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem atualizar cursos de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso atualizado com sucesso',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Já existe curso com este código na instituição',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover curso (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover cursos. Não permite remoção se houver turmas ativas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso removido com sucesso',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover curso com turmas ativas',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
