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
import { AcademicYearsService } from './academic-years.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('academic-years')
@ApiBearerAuth()
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Criar novo ano letivo',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem criar anos letivos em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Ano letivo criado com sucesso',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou datas conflitantes' })
  @ApiResponse({
    status: 409,
    description: 'Já existe ano letivo para este ano/instituição',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(createAcademicYearDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os anos letivos',
    description: 'Lista anos letivos com paginação e filtros',
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
    name: 'year',
    required: false,
    type: Number,
    description: 'Filtrar por ano',
    example: 2024,
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
    description: 'Lista de anos letivos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AcademicYearResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 10 },
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
    @Query('year', new DefaultValuePipe(0), ParseIntPipe) year?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    const yearFilter = year && year > 0 ? year : undefined;
    return this.academicYearsService.findAll(
      page,
      limit,
      institutionId,
      yearFilter,
      isActive,
    );
  }

  @Get('active')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar ano letivo ativo',
    description:
      'Retorna o ano letivo atualmente ativo para a instituição (baseado na data atual)',
  })
  @ApiQuery({
    name: 'institutionId',
    required: true,
    type: String,
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ano letivo ativo encontrado',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum ano letivo ativo encontrado',
  })
  findActive(@Query('institutionId') institutionId: string) {
    return this.academicYearsService.findActive(institutionId);
  }

  @Get(':id/delete-impact')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Pré-visualizar impacto da exclusão permanente',
    description:
      'Retorna contagens e amostras dos registros que serão afetados ao excluir permanentemente o ano letivo',
  })
  @ApiResponse({
    status: 200,
    description: 'Impacto da exclusão retornado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  getDeleteImpact(@Param('id') id: string) {
    return this.academicYearsService.getDeleteImpact(id);
  }

  @Get(':id')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar ano letivo por ID',
    description: 'Retorna detalhes completos do ano letivo incluindo períodos',
  })
  @ApiResponse({
    status: 200,
    description: 'Ano letivo encontrado',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  findOne(@Param('id') id: string) {
    return this.academicYearsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Atualizar ano letivo',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem atualizar anos letivos de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Ano letivo atualizado com sucesso',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Já existe ano letivo para este ano/instituição',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
  ) {
    return this.academicYearsService.update(id, updateAcademicYearDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover ano letivo (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover anos letivos. Não permite remoção se houver turmas ativas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ano letivo removido com sucesso',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover ano letivo com turmas ativas',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.academicYearsService.remove(id);
  }

  @Delete(':id/permanent')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Excluir ano letivo permanentemente',
    description:
      'Apenas SUPER_ADMIN pode excluir permanentemente um ano letivo, removendo também os registros vinculados em cascata',
  })
  @ApiResponse({
    status: 200,
    description: 'Ano letivo excluído permanentemente com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  removePermanently(@Param('id') id: string) {
    return this.academicYearsService.removePermanently(id);
  }
}
