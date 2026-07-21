import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';

@ApiTags('schedules')
@ApiBearerAuth()
@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('classes/:classId/schedules')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiParam({
    name: 'classId',
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Criar horário na grade da turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem criar horários. Valida conflitos de horário automaticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Horário criado com sucesso',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Conflito de horário detectado',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get('classes/:classId/schedules')
  @SkipOwnership()
  @ApiParam({
    name: 'classId',
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Listar grade horária da turma',
    description:
      'Retorna todos os horários da turma ordenados por dia da semana e horário',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de horários retornada com sucesso',
    type: [ScheduleResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  findByClass(@Param('classId') classId: string) {
    return this.schedulesService.findByClass(classId);
  }

  @Get('schedules/:id')
  @SkipOwnership()
  @ApiParam({
    name: 'id',
    description: 'ID do horário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Buscar horário por ID',
    description:
      'Retorna detalhes completos do horário incluindo turma, disciplina e professor',
  })
  @ApiResponse({
    status: 200,
    description: 'Horário encontrado',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch('schedules/:id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiParam({
    name: 'id',
    description: 'ID do horário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Atualizar horário',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem atualizar horários. Valida conflitos de horário automaticamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Horário atualizado com sucesso',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Conflito de horário detectado',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Delete('schedules/:id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiParam({
    name: 'id',
    description: 'ID do horário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Remover horário da grade',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem remover horários.',
  })
  @ApiResponse({
    status: 200,
    description: 'Horário removido com sucesso',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
