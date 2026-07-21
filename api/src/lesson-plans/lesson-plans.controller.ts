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
import { LessonPlansService } from './lesson-plans.service';
import {
  CreateLessonPlanDto,
  UpdateLessonPlanDto,
  LessonPlanResponseDto,
  RejectLessonPlanDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('lesson-plans')
@ApiBearerAuth()
@Controller('lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessonPlansService: LessonPlansService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Criar plano de ensino',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN, COORDINATOR e TEACHER podem criar planos de ensino',
  })
  @ApiResponse({
    status: 201,
    description: 'Plano de ensino criado com sucesso',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createLessonPlanDto: CreateLessonPlanDto) {
    return this.lessonPlansService.create(createLessonPlanDto);
  }

  @Get()
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({
    summary: 'Listar planos de ensino',
    description: 'Lista planos de ensino com paginação e filtros',
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
    name: 'academicPeriodId',
    required: false,
    type: String,
    description: 'Filtrar por período letivo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
    description: 'Filtrar por professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos de ensino retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/LessonPlanResponseDto' },
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
    @Query('academicPeriodId') academicPeriodId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.lessonPlansService.findAll(
      page,
      limit,
      classSubjectId,
      academicPeriodId,
      teacherId,
    );
  }

  @Get(':id')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiParam({
    name: 'id',
    description: 'ID do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar plano de ensino por ID',
    description: 'Retorna detalhes completos do plano de ensino',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano de ensino encontrado',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plano de ensino não encontrado' })
  findOne(@Param('id') id: string) {
    return this.lessonPlansService.findOne(id);
  }

  @Post(':id/submit')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiParam({
    name: 'id',
    description: 'ID do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Submeter plano de ensino para aprovação',
    description:
      'TEACHER pode submeter plano de ensino em rascunho para aprovação do coordenador',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano de ensino submetido com sucesso',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Apenas planos em rascunho podem ser submetidos' })
  @ApiResponse({ status: 404, description: 'Plano de ensino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  submit(@Param('id') id: string) {
    return this.lessonPlansService.submit(id);
  }

  @Post(':id/approve')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiParam({
    name: 'id',
    description: 'ID do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Aprovar plano de ensino',
    description:
      'COORDINATOR, INSTITUTION_ADMIN e SUPER_ADMIN podem aprovar planos submetidos',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano de ensino aprovado com sucesso',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Apenas planos submetidos podem ser aprovados' })
  @ApiResponse({ status: 404, description: 'Plano de ensino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  approve(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.lessonPlansService.approve(id, userId);
  }

  @Post(':id/reject')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiParam({
    name: 'id',
    description: 'ID do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Rejeitar plano de ensino',
    description:
      'COORDINATOR, INSTITUTION_ADMIN e SUPER_ADMIN podem rejeitar planos submetidos, informando o motivo',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano de ensino rejeitado com sucesso',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Apenas planos submetidos podem ser rejeitados' })
  @ApiResponse({ status: 404, description: 'Plano de ensino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  reject(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() rejectDto: RejectLessonPlanDto,
  ) {
    return this.lessonPlansService.reject(id, userId, rejectDto.reason);
  }

  @Patch(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER)
  @ApiParam({
    name: 'id',
    description: 'ID do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Atualizar plano de ensino',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN, COORDINATOR e TEACHER podem atualizar planos de ensino',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano de ensino atualizado com sucesso',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Plano de ensino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateLessonPlanDto: UpdateLessonPlanDto,
  ) {
    return this.lessonPlansService.update(id, updateLessonPlanDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiParam({
    name: 'id',
    description: 'ID do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Remover plano de ensino',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem remover planos de ensino',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano de ensino removido com sucesso',
    type: LessonPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plano de ensino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.lessonPlansService.remove(id);
  }
}
