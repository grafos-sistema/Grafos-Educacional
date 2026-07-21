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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto';
import { InstitutionResponseDto } from './dto/institution-response.dto';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('institutions')
@ApiBearerAuth()
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('public')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Listar instituições ativas (público)',
    description: `
Endpoint público para listar apenas instituições ativas.

**Uso:**
- Não requer autenticação
- Usado no auto-registro para selecionar a instituição
- Retorna apenas instituições com isActive = true
- Retorna dados básicos (id, nome, cidade, estado)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instituições ativas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
          name: { type: 'string', example: 'Escola Municipal Santos Dumont' },
          city: { type: 'string', example: 'São Paulo' },
          state: { type: 'string', example: 'SP' },
        },
      },
    },
  })
  async getPublicInstitutions() {
    return this.institutionsService.findAllActive();
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Criar nova instituição',
    description: 'Apenas SUPER_ADMIN pode criar novas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Instituição criada com sucesso',
    type: InstitutionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Slug ou CNPJ já existente' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return this.institutionsService.create(createInstitutionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as instituições',
    description: 'Lista instituições com paginação e filtros',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por nome, slug, cidade ou estado',
    example: 'escola',
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
    description: 'Lista de instituições retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/InstitutionResponseDto' },
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
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.institutionsService.findAll(page, limit, search, isActive);
  }

  @Get('slug/:slug')
  @Public()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Buscar instituição por slug (público)',
    description: 'Retorna dados públicos da instituição pelo slug para SEO e landing pages',
  })
  @ApiResponse({
    status: 200,
    description: 'Instituição encontrada',
    type: InstitutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  async findBySlug(@Param('slug') slug: string) {
    return this.institutionsService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Buscar instituição por ID',
    description:
      'Retorna detalhes da instituição incluindo contadores de relações',
  })
  @ApiResponse({
    status: 200,
    description: 'Instituição encontrada',
    type: InstitutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Atualizar instituição',
    description: 'SUPER_ADMIN e INSTITUTION_ADMIN podem atualizar instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Instituição atualizada com sucesso',
    type: InstitutionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  @ApiResponse({ status: 409, description: 'Slug ou CNPJ já existente' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    return this.institutionsService.update(id, updateInstitutionDto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Remover instituição (soft delete)',
    description:
      'Apenas SUPER_ADMIN pode remover instituições. Não permite remoção se houver usuários ativos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Instituição removida com sucesso',
    type: InstitutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover instituição com usuários ativos',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }
}
