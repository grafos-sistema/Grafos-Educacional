import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GradeCompositionStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateGradeCompositionDto,
  RequestChangesGradeCompositionDto,
} from './dto';
import { GradeCompositionsService } from './grade-compositions.service';

const managerRoles = [
  UserRole.SUPER_ADMIN_GLOBAL,
  UserRole.SUPER_ADMIN,
  UserRole.DIRECTOR,
  UserRole.INSTITUTION_ADMIN,
  UserRole.COORDINATOR,
];

@ApiTags('grade-compositions')
@ApiBearerAuth()
@Controller('grade-compositions')
export class GradeCompositionsController {
  constructor(
    private readonly gradeCompositionsService: GradeCompositionsService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Enviar composição de notas para análise' })
  create(
    @Body() dto: CreateGradeCompositionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.gradeCompositionsService.create(dto, user);
  }

  @Get()
  @Roles(...managerRoles, UserRole.TEACHER)
  @ApiQuery({ name: 'classSubjectId', required: false })
  @ApiQuery({ name: 'academicPeriodId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: GradeCompositionStatus })
  @ApiOperation({ summary: 'Listar composições de notas' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('classSubjectId') classSubjectId?: string,
    @Query('academicPeriodId') academicPeriodId?: string,
    @Query('status') status?: GradeCompositionStatus,
  ) {
    return this.gradeCompositionsService.findAll({
      currentUser: user,
      classSubjectId,
      academicPeriodId,
      status,
    });
  }

  @Patch(':id/approve')
  @Roles(...managerRoles)
  @ApiOperation({ summary: 'Aprovar composição de notas' })
  approve(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.gradeCompositionsService.approve(id, user);
  }

  @Patch(':id/request-changes')
  @Roles(...managerRoles)
  @ApiOperation({ summary: 'Devolver composição para ajustes' })
  requestChanges(
    @Param('id') id: string,
    @Body() dto: RequestChangesGradeCompositionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.gradeCompositionsService.requestChanges(id, dto.reason, user);
  }
}
