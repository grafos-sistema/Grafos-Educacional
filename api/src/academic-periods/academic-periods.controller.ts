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
import { AcademicPeriodsService } from './academic-periods.service';
import {
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  AcademicPeriodResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('academic-periods')
@ApiBearerAuth()
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Criar novo período acadêmico',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem criar períodos acadêmicos',
  })
  @ApiResponse({
    status: 201,
    description: 'Período acadêmico criado com sucesso',
    type: AcademicPeriodResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos, datas conflitantes ou ordem não sequencial',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe período com esta ordem ou datas conflitantes',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createAcademicPeriodDto: CreateAcademicPeriodDto) {
    return this.academicPeriodsService.create(createAcademicPeriodDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os períodos acadêmicos',
    description: 'Lista períodos acadêmicos com paginação e filtros',
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
    name: 'academicYearId',
    required: false,
    type: String,
    description: 'Filtrar por ano letivo',
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
    description: 'Lista de períodos acadêmicos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AcademicPeriodResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 4 },
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
    @Query('academicYearId') academicYearId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.academicPeriodsService.findAll(
      page,
      limit,
      academicYearId,
      isActive,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Buscar período acadêmico por ID',
    description: 'Retorna detalhes completos do período acadêmico',
  })
  @ApiResponse({
    status: 200,
    description: 'Período acadêmico encontrado',
    type: AcademicPeriodResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Período acadêmico não encontrado' })
  findOne(@Param('id') id: string) {
    return this.academicPeriodsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Atualizar período acadêmico',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem atualizar períodos acadêmicos',
  })
  @ApiResponse({
    status: 200,
    description: 'Período acadêmico atualizado com sucesso',
    type: AcademicPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Período acadêmico não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe período com esta ordem' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateAcademicPeriodDto: UpdateAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.update(id, updateAcademicPeriodDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover período acadêmico (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover períodos acadêmicos',
  })
  @ApiResponse({
    status: 200,
    description: 'Período acadêmico removido com sucesso',
    type: AcademicPeriodResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Período acadêmico não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.academicPeriodsService.remove(id);
  }
}
