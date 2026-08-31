import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AssessmentSlot, EvaluationStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEvaluationDto, RejectEvaluationDto } from './dto';
import { EvaluationsService } from './evaluations.service';

@ApiTags('evaluations')
@ApiBearerAuth()
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN_GLOBAL,
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Criar ou propor uma avaliação VA1 a VA4' })
  create(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.evaluationsService.create(dto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN_GLOBAL,
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiQuery({ name: 'classSubjectId', required: false })
  @ApiQuery({ name: 'academicPeriodId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: EvaluationStatus })
  @ApiQuery({ name: 'slot', required: false, enum: AssessmentSlot })
  @ApiOperation({ summary: 'Listar avaliações da instituição ou do professor' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('classSubjectId') classSubjectId?: string,
    @Query('academicPeriodId') academicPeriodId?: string,
    @Query('status') status?: EvaluationStatus,
    @Query('slot') slot?: AssessmentSlot,
  ) {
    return this.evaluationsService.findAll({
      currentUser: user,
      classSubjectId,
      academicPeriodId,
      status,
      slot,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN_GLOBAL,
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.evaluationsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @Roles(
    UserRole.SUPER_ADMIN_GLOBAL,
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Aprovar avaliação proposta por professor' })
  approve(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.evaluationsService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(
    UserRole.SUPER_ADMIN_GLOBAL,
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Devolver avaliação para revisão' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectEvaluationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.evaluationsService.reject(id, dto.reason, user);
  }
}
