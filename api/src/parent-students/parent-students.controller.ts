import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ParentStudentsService } from './parent-students.service';
import {
  CreateParentStudentDto,
  UpdateParentStudentDto,
  ParentStudentResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('parent-students')
@ApiBearerAuth()
@Controller('parent-students')
export class ParentStudentsController {
  constructor(
    private readonly parentStudentsService: ParentStudentsService,
  ) {}

  @Post()
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Vincular responsável a aluno',
    description:
      'Cria um relacionamento entre um responsável e um aluno',
  })
  @ApiResponse({
    status: 201,
    description: 'Relacionamento criado com sucesso',
    type: ParentStudentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Responsável ou aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Relacionamento já existe' })
  create(@Body() createDto: CreateParentStudentDto) {
    return this.parentStudentsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Listar todos os relacionamentos',
    description: 'Lista todos os vínculos entre responsáveis e alunos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relacionamentos',
    type: [ParentStudentResponseDto],
  })
  findAll() {
    return this.parentStudentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar relacionamento por ID',
    description: 'Retorna detalhes de um relacionamento específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Relacionamento encontrado',
    type: ParentStudentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Relacionamento não encontrado' })
  findOne(@Param('id') id: string) {
    return this.parentStudentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Atualizar relacionamento',
    description: 'Atualiza informações do relacionamento (tipo, contato principal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Relacionamento atualizado',
    type: ParentStudentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Relacionamento não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateParentStudentDto,
  ) {
    return this.parentStudentsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Remover relacionamento',
    description: 'Remove o vínculo entre responsável e aluno',
  })
  @ApiResponse({ status: 204, description: 'Relacionamento removido' })
  @ApiResponse({ status: 404, description: 'Relacionamento não encontrado' })
  async remove(@Param('id') id: string) {
    await this.parentStudentsService.remove(id);
  }
}
