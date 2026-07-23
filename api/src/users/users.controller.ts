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
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserResponseDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { InstitutionAdminGuard } from '../auth/guards/institution-admin.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { SkipOwnership } from '../common/decorators/skip-ownership.decorator';
import { multerConfig } from '../common/config/multer.config';
import { ParentStudentsService } from '../parent-students/parent-students.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly parentStudentsService: ParentStudentsService,
  ) {}

  @Post()
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Criar novo usuário',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem criar usuários em suas instituições',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @SkipOwnership()
  @ApiOperation({
    summary: 'Listar todos os usuários',
    description: 'Lista usuários com paginação e filtros',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por email, nome ou CPF',
    example: 'João',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filtrar por role',
    example: UserRole.TEACHER,
  })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    type: String,
    description: 'Filtrar por instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo/inativo',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('institutionId') institutionId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('hasTeacherProfile') hasTeacherProfile?: string,
    @Query('hasStudentProfile') hasStudentProfile?: string,
    @Query('hasParentProfile') hasParentProfile?: string,
    @Query('hasProfile') hasProfile?: string,
  ) {
    return this.usersService.findAll(
      page,
      limit,
      search,
      role,
      institutionId,
      isActive,
      hasTeacherProfile === 'true' ? true : hasTeacherProfile === 'false' ? false : undefined,
      hasStudentProfile === 'true' ? true : hasStudentProfile === 'false' ? false : undefined,
      hasParentProfile === 'true' ? true : hasParentProfile === 'false' ? false : undefined,
      hasProfile === 'true' ? true : hasProfile === 'false' ? false : undefined,
    );
  }

  @Get('me')
  @SkipOwnership()
  @ApiOperation({
    summary: 'Obter perfil do usuário autenticado',
    description: 'Retorna os dados do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso',
    type: UserResponseDto,
  })
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description:
      'Usuários podem acessar apenas seus próprios dados. Admins podem acessar qualquer usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({
    summary: 'Atualizar usuário',
    description:
      'Usuários podem atualizar apenas seus próprios dados. Admins podem atualizar qualquer usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Remover usuário (soft delete)',
    description:
      'SUPER_ADMIN e INSTITUTION_ADMIN podem remover usuários de suas instituições',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete(':id/permanent')
  @UseGuards(InstitutionAdminGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Excluir usuário permanentemente',
    description:
      'Apenas SUPER_ADMIN pode excluir um usuário permanentemente, incluindo o vínculo com o Supabase Auth.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário excluído permanentemente com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuário excluído permanentemente com sucesso' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  removePermanently(@Param('id') id: string) {
    return this.usersService.removePermanently(id);
  }

  @Post(':id/change-password')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alterar senha do usuário',
    description:
      'Usuários podem alterar apenas sua própria senha. Requer senha atual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Senha alterada com sucesso' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Senha atual incorreta' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Post(':id/avatar')
  @UseGuards(OwnershipGuard)
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de avatar do usuário',
    description:
      'Usuários podem fazer upload apenas do seu próprio avatar. Formatos aceitos: JPEG, PNG, WEBP. Tamanho máximo: 5MB.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem do avatar',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Avatar atualizado com sucesso' },
        avatar: {
          type: 'string',
          example: 'https://your-project-ref.supabase.co/storage/v1/object/public/avatars/institutions/example/users/example/avatar.webp',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou não fornecido' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de avatar não fornecido');
    }
    return this.usersService.updateAvatar(id, file);
  }

  @Get(':id/children')
  @ApiOperation({
    summary: 'Listar filhos de um responsável',
    description: 'Retorna todos os alunos vinculados a um responsável',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de filhos do responsável',
  })
  @ApiResponse({ status: 404, description: 'Responsável não encontrado' })
  getChildren(@Param('id') id: string) {
    return this.parentStudentsService.findByParentUserId(id);
  }

  @Get(':id/parents')
  @ApiOperation({
    summary: 'Listar responsáveis de um aluno',
    description: 'Retorna todos os responsáveis vinculados a um aluno',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de responsáveis do aluno',
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  getParents(@Param('id') id: string) {
    return this.parentStudentsService.findByStudentUserId(id);
  }

  // ==================== GESTÃO DE PERFIS ====================

  @Post(':id/profiles/teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Adicionar perfil de professor',
    description: 'Adiciona perfil de professor a um usuário existente',
  })
  @ApiResponse({ status: 201, description: 'Perfil de professor adicionado' })
  @ApiResponse({ status: 409, description: 'Usuário já possui perfil de professor' })
  addTeacherProfile(
    @Param('id') userId: string,
    @Body() data?: { specialization?: string; degree?: string; registrationNumber?: string },
  ) {
    return this.usersService.addTeacherProfile(userId, data);
  }

  @Post(':id/profiles/student')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Adicionar perfil de aluno',
    description: 'Adiciona perfil de aluno a um usuário existente',
  })
  @ApiResponse({ status: 201, description: 'Perfil de aluno adicionado' })
  @ApiResponse({ status: 409, description: 'Usuário já possui perfil de aluno' })
  addStudentProfile(
    @Param('id') userId: string,
    @Body() data?: { registrationNumber?: string; enrollmentNumber?: string; enrollmentDate?: Date },
  ) {
    return this.usersService.addStudentProfile(userId, data);
  }

  @Post(':id/profiles/parent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Adicionar perfil de responsável',
    description: 'Adiciona perfil de responsável a um usuário existente',
  })
  @ApiResponse({ status: 201, description: 'Perfil de responsável adicionado' })
  @ApiResponse({ status: 409, description: 'Usuário já possui perfil de responsável' })
  addParentProfile(
    @Param('id') userId: string,
    @Body() data?: { occupation?: string },
  ) {
    return this.usersService.addParentProfile(userId, data);
  }

  @Delete(':id/profiles/teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover perfil de professor',
    description: 'Remove perfil de professor de um usuário',
  })
  @ApiResponse({ status: 204, description: 'Perfil de professor removido' })
  @ApiResponse({ status: 404, description: 'Usuário não possui perfil de professor' })
  @ApiResponse({ status: 400, description: 'Professor tem turmas ativas' })
  async removeTeacherProfile(@Param('id') userId: string) {
    await this.usersService.removeTeacherProfile(userId);
  }

  @Delete(':id/profiles/student')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover perfil de aluno',
    description: 'Remove perfil de aluno de um usuário',
  })
  @ApiResponse({ status: 204, description: 'Perfil de aluno removido' })
  @ApiResponse({ status: 404, description: 'Usuário não possui perfil de aluno' })
  @ApiResponse({ status: 400, description: 'Aluno tem matrículas ativas' })
  async removeStudentProfile(@Param('id') userId: string) {
    await this.usersService.removeStudentProfile(userId);
  }

  @Delete(':id/profiles/parent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover perfil de responsável',
    description: 'Remove perfil de responsável de um usuário',
  })
  @ApiResponse({ status: 204, description: 'Perfil de responsável removido' })
  @ApiResponse({ status: 404, description: 'Usuário não possui perfil de responsável' })
  @ApiResponse({ status: 400, description: 'Responsável tem alunos vinculados' })
  async removeParentProfile(@Param('id') userId: string) {
    await this.usersService.removeParentProfile(userId);
  }

  // ==================== APROVAÇÃO RÁPIDA ====================

  @Post(':id/quick-approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Aprovação rápida de usuário pendente',
    description: 'Aprova usuário pendente adicionando o perfil solicitado',
  })
  @ApiResponse({ status: 201, description: 'Usuário aprovado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou usuário não está pendente' })
  @ApiResponse({ status: 409, description: 'Usuário já possui o perfil' })
  quickApprove(
    @Param('id') userId: string,
    @Body() data: { profileType: 'TEACHER' | 'STUDENT' | 'PARENT'; profileData?: any },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.quickApprove(
      userId,
      data.profileType,
      data.profileData || {},
      user.userId,
    );
  }

  @Post('bulk-approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Aprovação em massa de usuários pendentes',
    description: 'Aprova múltiplos usuários de uma vez',
  })
  @ApiResponse({ status: 201, description: 'Aprovações processadas' })
  bulkApprove(
    @Body()
    data: {
      approvals: Array<{
        userId: string;
        profileType: 'TEACHER' | 'STUDENT' | 'PARENT';
        profileData?: any;
      }>;
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.bulkApprove(data.approvals, user.userId);
  }
}
