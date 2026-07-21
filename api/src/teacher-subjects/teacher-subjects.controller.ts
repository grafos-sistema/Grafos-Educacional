import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeacherSubjectsService } from './teacher-subjects.service';
import {
  CreateTeacherSubjectDto,
  BulkCreateTeacherSubjectDto,
  TeacherSubjectResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Teacher Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-subjects')
export class TeacherSubjectsController {
  constructor(private readonly teacherSubjectsService: TeacherSubjectsService) {}

  @Get('my-subjects')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Listar minhas disciplinas configuradas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas do professor',
    type: [TeacherSubjectResponseDto],
  })
  async getMySubjects(@CurrentUser() user: any) {
    return this.teacherSubjectsService.findAllByTeacherUserId(user.userId);
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Listar disciplinas de um professor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas do professor',
    type: [TeacherSubjectResponseDto],
  })
  async getByTeacher(@Param('teacherId') teacherId: string) {
    return this.teacherSubjectsService.findAllByTeacher(teacherId);
  }

  @Post('my-subjects')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Adicionar disciplina às minhas disciplinas' })
  @ApiResponse({
    status: 201,
    description: 'Disciplina adicionada',
    type: TeacherSubjectResponseDto,
  })
  async addMySubject(
    @CurrentUser() user: any,
    @Body() createDto: CreateTeacherSubjectDto,
  ) {
    const teacher = await this.teacherSubjectsService['prisma'].teacher.findUnique({
      where: { userId: user.userId },
    });
    if (!teacher) {
      throw new Error('Perfil de professor não encontrado');
    }
    return this.teacherSubjectsService.create(teacher.id, createDto);
  }

  @Post('my-subjects/bulk')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Adicionar múltiplas disciplinas' })
  @ApiResponse({
    status: 201,
    description: 'Disciplinas adicionadas',
  })
  async addMySubjectsBulk(
    @CurrentUser() user: any,
    @Body() bulkDto: BulkCreateTeacherSubjectDto,
  ) {
    const teacher = await this.teacherSubjectsService['prisma'].teacher.findUnique({
      where: { userId: user.userId },
    });
    if (!teacher) {
      throw new Error('Perfil de professor não encontrado');
    }
    return this.teacherSubjectsService.bulkCreate(teacher.id, bulkDto);
  }

  @Put('my-subjects/sync')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Sincronizar disciplinas (substitui todas)' })
  @ApiResponse({
    status: 200,
    description: 'Disciplinas sincronizadas',
    type: [TeacherSubjectResponseDto],
  })
  async syncMySubjects(
    @CurrentUser() user: any,
    @Body() body: { subjectIds: string[] },
  ) {
    const teacher = await this.teacherSubjectsService['prisma'].teacher.findUnique({
      where: { userId: user.userId },
    });
    if (!teacher) {
      throw new Error('Perfil de professor não encontrado');
    }
    return this.teacherSubjectsService.syncTeacherSubjects(
      teacher.id,
      body.subjectIds,
    );
  }

  @Delete('my-subjects/:subjectId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Remover disciplina das minhas disciplinas' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida',
  })
  async removeMySubject(
    @CurrentUser() user: any,
    @Param('subjectId') subjectId: string,
  ) {
    const teacher = await this.teacherSubjectsService['prisma'].teacher.findUnique({
      where: { userId: user.userId },
    });
    if (!teacher) {
      throw new Error('Perfil de professor não encontrado');
    }
    return this.teacherSubjectsService.remove(teacher.id, subjectId);
  }

  @Post('teacher/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Adicionar disciplina a um professor' })
  @ApiResponse({
    status: 201,
    description: 'Disciplina adicionada',
    type: TeacherSubjectResponseDto,
  })
  async addToTeacher(
    @Param('teacherId') teacherId: string,
    @Body() createDto: CreateTeacherSubjectDto,
  ) {
    return this.teacherSubjectsService.create(teacherId, createDto);
  }

  @Put('teacher/:teacherId/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Sincronizar disciplinas de um professor' })
  @ApiResponse({
    status: 200,
    description: 'Disciplinas sincronizadas',
    type: [TeacherSubjectResponseDto],
  })
  async syncTeacherSubjects(
    @Param('teacherId') teacherId: string,
    @Body() body: { subjectIds: string[] },
  ) {
    return this.teacherSubjectsService.syncTeacherSubjects(
      teacherId,
      body.subjectIds,
    );
  }

  @Delete('teacher/:teacherId/:subjectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Remover disciplina de um professor' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida',
  })
  async removeFromTeacher(
    @Param('teacherId') teacherId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.teacherSubjectsService.remove(teacherId, subjectId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Remover vínculo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Vínculo removido',
  })
  async removeById(@Param('id') id: string) {
    return this.teacherSubjectsService.removeById(id);
  }
}
