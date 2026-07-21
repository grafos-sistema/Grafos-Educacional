import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TeacherAttendancesService } from './teacher-attendances.service';
import { CreateTeacherAttendanceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('teacher-attendances')
@Controller('teacher-attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeacherAttendancesController {
  constructor(
    private readonly teacherAttendancesService: TeacherAttendancesService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Criar registro de presença do professor',
    description: 'Registra manualmente a presença do professor em uma aula',
  })
  async create(@Body() dto: CreateTeacherAttendanceDto) {
    return await this.teacherAttendancesService.create(dto);
  }

  @Get('my')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Buscar meus registros de presença',
    description: 'Retorna o histórico de presença do professor logado',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Mês (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano',
  })
  @ApiQuery({
    name: 'classSubjectId',
    required: false,
    type: String,
    description: 'ID da disciplina',
  })
  async getMyAttendances(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('classSubjectId') classSubjectId?: string,
  ) {
    const teacherId = user.teacherId || user.teacherProfile?.id;
    if (!teacherId) {
      throw new Error('Professor não encontrado');
    }

    return await this.teacherAttendancesService.findByTeacher(teacherId, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      classSubjectId,
    });
  }

  @Get('teacher/:teacherId')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({
    summary: 'Buscar registros de um professor',
    description:
      'Retorna o histórico de presença de um professor específico (admin/coordenador)',
  })
  @ApiParam({ name: 'teacherId', description: 'ID do professor' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Mês (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano',
  })
  @ApiQuery({
    name: 'classSubjectId',
    required: false,
    type: String,
    description: 'ID da disciplina',
  })
  async getTeacherAttendances(
    @Param('teacherId') teacherId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('classSubjectId') classSubjectId?: string,
  ) {
    return await this.teacherAttendancesService.findByTeacher(teacherId, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      classSubjectId,
    });
  }

  @Get('schedules/:teacherId')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({
    summary: 'Buscar grade horária do professor',
    description: 'Retorna a grade horária completa do professor',
  })
  @ApiParam({ name: 'teacherId', description: 'ID do professor' })
  async getTeacherSchedule(@Param('teacherId') teacherId: string) {
    return await this.teacherAttendancesService.getTeacherSchedule(teacherId);
  }

  @Get('stats/:teacherId')
  @SkipOwnership()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({
    summary: 'Buscar estatísticas do professor',
    description: 'Retorna estatísticas de presença do professor',
  })
  @ApiParam({ name: 'teacherId', description: 'ID do professor' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial (ISO)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final (ISO)',
  })
  async getTeacherStats(
    @Param('teacherId') teacherId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.teacherAttendancesService.getTeacherStats(
      teacherId,
      startDate,
      endDate,
    );
  }
}
