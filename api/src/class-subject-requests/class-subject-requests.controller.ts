import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClassSubjectRequestsService } from './class-subject-requests.service';
import { CreateSubjectRequestDto, RejectRequestDto } from './dto';
import { UserRole, RequestStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { TeacherGuard } from '../auth/guards/teacher.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('class-subject-requests')
@ApiBearerAuth()
@Controller('class-subject-requests')
export class ClassSubjectRequestsController {
  constructor(
    private readonly requestsService: ClassSubjectRequestsService,
  ) {}

  @Post()
  @UseGuards(TeacherGuard)
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Criar solicitação de disciplina',
    description: 'Professor solicita lecionar uma disciplina em uma turma',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitação criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Solicitação já existe ou disciplina já atribuída' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateSubjectRequestDto,
  ) {
    return this.requestsService.createByUserId(userId, createDto);
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
    summary: 'Listar solicitações',
    description: 'Lista solicitações com filtros. Professores veem apenas suas solicitações.',
  })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RequestStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitações',
  })
  async findAll(
    @CurrentUser('role') role: UserRole,
    @CurrentUser('userId') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @Query('institutionId') queryInstitutionId?: string,
    @Query('teacherId') queryTeacherId?: string,
    @Query('status') status?: RequestStatus,
  ) {
    // Professores só veem suas próprias solicitações
    let finalTeacherId = queryTeacherId;

    if (role === UserRole.TEACHER) {
      finalTeacherId = await this.requestsService.getTeacherIdByUserId(userId);
    }

    const finalInstitutionId = queryInstitutionId || institutionId;

    return this.requestsService.findAll(
      finalInstitutionId,
      finalTeacherId,
      status,
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
  @ApiOperation({
    summary: 'Buscar solicitação por ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação encontrada',
  })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprovar solicitação',
    description: 'Aprova a solicitação e cria a atribuição da disciplina ao professor',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação aprovada e disciplina atribuída',
  })
  @ApiResponse({ status: 400, description: 'Solicitação não pode ser aprovada' })
  @ApiResponse({ status: 409, description: 'Disciplina já possui professor' })
  approve(
    @Param('id') id: string,
    @CurrentUser('userId') reviewedById: string,
    @Body('weeklyHours') weeklyHours?: number,
  ) {
    return this.requestsService.approve(id, reviewedById, weeklyHours);
  }

  @Post(':id/reject')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rejeitar solicitação',
    description: 'Rejeita a solicitação informando o motivo',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação rejeitada',
  })
  @ApiResponse({ status: 400, description: 'Solicitação não pode ser rejeitada' })
  reject(
    @Param('id') id: string,
    @CurrentUser('userId') reviewedById: string,
    @Body() rejectDto: RejectRequestDto,
  ) {
    return this.requestsService.reject(id, reviewedById, rejectDto);
  }

  @Delete(':id')
  @UseGuards(TeacherGuard)
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Cancelar solicitação',
    description: 'Professor cancela sua própria solicitação pendente',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação cancelada',
  })
  @ApiResponse({ status: 400, description: 'Solicitação não pode ser cancelada' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const teacherId = await this.requestsService.getTeacherIdByUserId(userId);
    return this.requestsService.cancel(id, teacherId);
  }
}
