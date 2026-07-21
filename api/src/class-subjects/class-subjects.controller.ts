import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClassSubjectsService } from './class-subjects.service';
import { CreateClassSubjectDto } from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';

@ApiTags('class-subjects')
@ApiBearerAuth()
@Controller('class-subjects')
export class ClassSubjectsController {
  constructor(private readonly classSubjectsService: ClassSubjectsService) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Vincular disciplina à turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem vincular disciplinas a turmas',
  })
  @ApiResponse({
    status: 201,
    description: 'Disciplina vinculada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Turma, disciplina ou professor não encontrado' })
  @ApiResponse({ status: 409, description: 'Disciplina já vinculada a esta turma' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createClassSubjectDto: CreateClassSubjectDto) {
    return this.classSubjectsService.create(createClassSubjectDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Remover disciplina da turma',
    description:
      'SUPER_ADMIN, INSTITUTION_ADMIN e COORDINATOR podem remover disciplinas de turmas',
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida da turma com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Vínculo não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.classSubjectsService.remove(id);
  }
}
