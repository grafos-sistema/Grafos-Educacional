import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { IDEBService } from './ideb.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateIDEBTargetDto, UpdateIDEBTargetDto } from './dto/ideb-target.dto';
import { CalculateIDEBDto } from './dto/calculate-ideb.dto';
import { Cache } from '../common/decorators/cache.decorator';
import { ExportService } from '../common/services/export.service';

@ApiTags('ideb')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ideb')
export class IDEBController {
  constructor(
    private readonly idebService: IDEBService,
    private readonly exportService: ExportService,
  ) {}

  // ==========================================
  // METAS IDEB
  // ==========================================

  @Post('targets')
  @ApiOperation({
    summary: 'Criar meta IDEB',
    description: 'Define uma nova meta de IDEB para uma série específica e ano',
  })
  @ApiBody({ type: CreateIDEBTargetDto })
  @ApiResponse({
    status: 201,
    description: 'Meta criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Meta já existe para este ano e série',
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  createTarget(@CurrentUser() user: any, @Body() dto: CreateIDEBTargetDto) {
    return this.idebService.createTarget(user.institutionId, dto);
  }

  @Get('targets')
  @Cache()
  @ApiOperation({ summary: 'Listar metas IDEB' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'gradeLevel', required: false })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getTargets(
    @CurrentUser() user: any,
    @Query('year', new DefaultValuePipe(null)) year?: number,
    @Query('gradeLevel') gradeLevel?: string,
  ) {
    return this.idebService.getTargets(user.institutionId, year, gradeLevel);
  }

  @Get('targets/:id')
  @ApiOperation({ summary: 'Buscar meta específica' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getTarget(@Param('id') id: string) {
    return this.idebService.getTarget(id);
  }

  @Put('targets/:id')
  @ApiOperation({ summary: 'Atualizar meta IDEB' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  updateTarget(@Param('id') id: string, @Body() dto: UpdateIDEBTargetDto) {
    return this.idebService.updateTarget(id, dto);
  }

  @Delete('targets/:id')
  @ApiOperation({ summary: 'Deletar meta IDEB' })
  @ApiParam({ name: 'id', description: 'ID da meta' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  deleteTarget(@Param('id') id: string) {
    return this.idebService.deleteTarget(id);
  }

  // ==========================================
  // INDICADORES IDEB
  // ==========================================

  @Post('indicators/calculate')
  @ApiOperation({
    summary: 'Calcular indicador IDEB',
    description:
      'Calcula o IDEB baseado em dados de fluxo escolar e proficiência SAEB. O cálculo é feito automaticamente a partir dos dados de aprovação, abandono e resultados de simulados.',
  })
  @ApiBody({ type: CalculateIDEBDto })
  @ApiResponse({
    status: 201,
    description: 'Indicador calculado e salvo com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados insuficientes para cálculo',
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  calculateIndicator(@CurrentUser() user: any, @Body() dto: CalculateIDEBDto) {
    return this.idebService.calculateIndicator(user.institutionId, dto);
  }

  @Get('indicators')
  @Cache()
  @ApiOperation({ summary: 'Listar indicadores IDEB' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'gradeLevel', required: false })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getIndicators(
    @CurrentUser() user: any,
    @Query('year', new DefaultValuePipe(null)) year?: number,
    @Query('gradeLevel') gradeLevel?: string,
  ) {
    return this.idebService.getIndicators(user.institutionId, year, gradeLevel);
  }

  @Get('indicators/:id')
  @ApiOperation({ summary: 'Buscar indicador específico' })
  @ApiParam({ name: 'id', description: 'ID do indicador' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getIndicator(@Param('id') id: string) {
    return this.idebService.getIndicator(id);
  }

  // ==========================================
  // ANÁLISES E COMPARAÇÕES
  // ==========================================

  @Get('compare/:year')
  @ApiOperation({ summary: 'Comparar IDEB com metas' })
  @ApiParam({ name: 'year', description: 'Ano de referência' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  compareWithTargets(
    @CurrentUser() user: any,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.idebService.compareWithTargets(user.institutionId, year);
  }

  @Get('trend/:gradeLevel')
  @ApiOperation({ summary: 'Obter evolução histórica do IDEB' })
  @ApiParam({ name: 'gradeLevel', description: 'Série/ano escolar' })
  @ApiQuery({ name: 'limit', required: false })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getHistoricalTrend(
    @CurrentUser() user: any,
    @Param('gradeLevel') gradeLevel: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.idebService.getHistoricalTrend(user.institutionId, gradeLevel, limit);
  }

  @Get('dashboard/:year')
  @Cache()
  @ApiOperation({
    summary: 'Dashboard completo de IDEB',
    description:
      'Retorna visão consolidada com indicadores, metas, comparações e resumo estatístico para o ano especificado',
  })
  @ApiParam({
    name: 'year',
    description: 'Ano de referência (ex: 2024)',
    example: 2024,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retornado com sucesso',
    schema: {
      example: {
        year: 2024,
        indicators: [],
        targets: [],
        comparison: [],
        summary: {
          averageIDEB: 5.5,
          totalGradeLevels: 3,
          targetsSet: 3,
          targetsAchieved: 2,
          achievementRate: 66.67,
        },
      },
    },
  })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getDashboard(
    @CurrentUser() user: any,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.idebService.getDashboard(user.institutionId, year);
  }

  // ==========================================
  // EXPORTS
  // ==========================================

  @Get('indicators/export/csv')
  @ApiOperation({
    summary: 'Exportar indicadores IDEB para CSV',
    description: 'Exporta todos os indicadores da instituição em formato CSV',
  })
  @ApiQuery({ name: 'year', required: false })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="ideb-indicators.csv"')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  async exportIndicatorsCSV(
    @CurrentUser() user: any,
    @Query('year', new DefaultValuePipe(null)) year?: number,
  ) {
    const indicators = await this.idebService.getIndicators(
      user.institutionId,
      year,
    );

    return this.exportService.generateCSV(indicators, [
      { key: 'year', label: 'Ano' },
      { key: 'gradeLevel', label: 'Série' },
      {
        key: 'idebScore',
        label: 'IDEB',
        format: (v) => this.exportService.formatNumber(v, 2),
      },
      {
        key: 'approvalRate',
        label: 'Taxa de Aprovação',
        format: (v) => this.exportService.formatPercent(v),
      },
      {
        key: 'dropoutRate',
        label: 'Taxa de Abandono',
        format: (v) => this.exportService.formatPercent(v),
      },
      {
        key: 'repetitionRate',
        label: 'Taxa de Reprovação',
        format: (v) => this.exportService.formatPercent(v),
      },
      {
        key: 'averageProficiency',
        label: 'Proficiência Média',
        format: (v) => this.exportService.formatNumber(v, 2),
      },
      {
        key: 'mathProficiency',
        label: 'Proficiência Matemática',
        format: (v) => (v ? this.exportService.formatNumber(v, 2) : 'N/A'),
      },
      {
        key: 'portugueseProficiency',
        label: 'Proficiência Português',
        format: (v) => (v ? this.exportService.formatNumber(v, 2) : 'N/A'),
      },
      { key: 'totalStudents', label: 'Total de Alunos' },
      { key: 'evaluatedStudents', label: 'Alunos Avaliados' },
      {
        key: 'calculatedAt',
        label: 'Calculado em',
        format: (v) => this.exportService.formatDateTime(v),
      },
    ]);
  }

  @Get('comparison/:year/export/csv')
  @ApiOperation({
    summary: 'Exportar comparação IDEB x Metas para CSV',
    description: 'Exporta comparação entre IDEB alcançado e metas estabelecidas',
  })
  @ApiParam({ name: 'year', description: 'Ano de referência' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="ideb-comparison.csv"')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  async exportComparisonCSV(
    @CurrentUser() user: any,
    @Param('year', ParseIntPipe) year: number,
  ) {
    const comparison = await this.idebService.compareWithTargets(
      user.institutionId,
      year,
    );

    return this.exportService.generateCSV(comparison, [
      { key: 'gradeLevel', label: 'Série' },
      {
        key: 'idebScore',
        label: 'IDEB Alcançado',
        format: (v) => this.exportService.formatNumber(v, 2),
      },
      {
        key: 'target',
        label: 'Meta Institucional',
        format: (v) => (v ? this.exportService.formatNumber(v, 2) : 'N/A'),
      },
      {
        key: 'nationalTarget',
        label: 'Meta Nacional',
        format: (v) => (v ? this.exportService.formatNumber(v, 2) : 'N/A'),
      },
      {
        key: 'stateTarget',
        label: 'Meta Estadual',
        format: (v) => (v ? this.exportService.formatNumber(v, 2) : 'N/A'),
      },
      {
        key: 'difference',
        label: 'Diferença',
        format: (v) => (v !== null ? this.exportService.formatNumber(v, 2) : 'N/A'),
      },
      {
        key: 'percentageAchieved',
        label: '% Alcançado',
        format: (v) => (v !== null ? this.exportService.formatNumber(v, 1) + '%' : 'N/A'),
      },
      {
        key: 'achieved',
        label: 'Meta Alcançada',
        format: (v) => (v === true ? 'Sim' : v === false ? 'Não' : 'N/A'),
      },
    ]);
  }

  // ==========================================
  // SIMULAÇÕES E PROJEÇÕES
  // ==========================================

  @Post('simulate')
  @ApiOperation({
    summary: 'Simular diferentes cenários de IDEB',
    description:
      'Permite simular o impacto de mudanças na taxa de aprovação e proficiência no IDEB',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        year: { type: 'number', example: 2024 },
        gradeLevel: { type: 'string', example: '5º ano' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approvalRate: { type: 'number', minimum: 0, maximum: 1, example: 0.9 },
              averageProficiency: { type: 'number', minimum: 0, maximum: 10, example: 6.5 },
              mathProficiency: { type: 'number', minimum: 0, maximum: 10 },
              portugueseProficiency: { type: 'number', minimum: 0, maximum: 10 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Simulações calculadas com sucesso',
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  async simulate(
    @CurrentUser() user: any,
    @Body()
    data: {
      year: number;
      gradeLevel: string;
      scenarios: Array<{
        approvalRate?: number;
        averageProficiency?: number;
        mathProficiency?: number;
        portugueseProficiency?: number;
      }>;
    },
  ) {
    return this.idebService.simulateIDEB(
      user.institutionId,
      data.year,
      data.gradeLevel,
      data.scenarios,
    );
  }

  @Get('project-to-target/:year/:gradeLevel')
  @ApiOperation({
    summary: 'Projetar caminhos para alcançar meta IDEB',
    description:
      'Calcula diferentes estratégias (foco em aprovação, proficiência ou ambos) para atingir a meta estabelecida',
  })
  @ApiParam({ name: 'year', description: 'Ano de referência', example: 2024 })
  @ApiParam({ name: 'gradeLevel', description: 'Série/ano escolar', example: '5º ano' })
  @ApiResponse({
    status: 200,
    description: 'Projeções calculadas com sucesso',
    schema: {
      example: {
        current: {
          ideb: 5.2,
          approvalRate: 0.87,
          proficiency: 5.98,
        },
        target: {
          ideb: 6.0,
          gap: 0.8,
          percentageGap: 15.38,
        },
        paths: [
          {
            strategy: 'Foco em qualidade do ensino',
            description: 'Manter a taxa de aprovação e melhorar o desempenho nas avaliações',
            requiredApprovalRate: 0.87,
            requiredProficiency: 6.9,
            feasible: true,
            effort: 9.2,
          },
        ],
      },
    },
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  async projectToTarget(
    @CurrentUser() user: any,
    @Param('year', ParseIntPipe) year: number,
    @Param('gradeLevel') gradeLevel: string,
  ) {
    return this.idebService.projectToTarget(user.institutionId, year, gradeLevel);
  }
}

