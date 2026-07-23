import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { extname } from 'path';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private buildInitialPassword(email: string) {
    const [localPart] = email.toLowerCase().split('@');
    return `${localPart}@Grafos`;
  }

  private getAvatarBucketName() {
    return this.configService.get<string>('storage.avatarsBucket', 'avatars');
  }

  private getSupabaseAdminClient(): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('storage.supabaseUrl')?.trim();
    const serviceRoleKey = this.configService.get<string>('storage.serviceRoleKey')?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException(
        'Upload de avatar indisponivel: credenciais do Supabase Storage nao configuradas.',
      );
    }

    return createClient(supabaseUrl.replace(/\/+$/, ''), serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private getAvatarExtension(file: Express.Multer.File) {
    const originalExtension = extname(file.originalname ?? '').toLowerCase();

    if (['.jpeg', '.jpg', '.png', '.webp'].includes(originalExtension)) {
      return originalExtension;
    }

    switch (file.mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        throw new BadRequestException('Tipo de arquivo invalido para avatar');
    }
  }

  private buildAvatarStoragePath(
    user: { id: string; institutionId: string },
    file: Express.Multer.File,
  ) {
    const extension = this.getAvatarExtension(file);
    return `institutions/${user.institutionId}/users/${user.id}/avatar-${Date.now()}${extension}`;
  }

  private extractStoragePathFromAvatarUrl(avatarUrl?: string | null) {
    if (!avatarUrl) {
      return null;
    }

    try {
      const bucket = this.getAvatarBucketName();
      const url = new URL(avatarUrl);
      const prefix = `/storage/v1/object/public/${bucket}/`;
      const pathIndex = url.pathname.indexOf(prefix);

      if (pathIndex === -1) {
        return null;
      }

      return decodeURIComponent(url.pathname.slice(pathIndex + prefix.length));
    } catch {
      return null;
    }
  }

  /**
   * Cria um novo usuário
   */
  async create(createUserDto: CreateUserDto) {
    const { email, cpf, password, birthDate, institutionId, firstName, lastName, ...data } =
      createUserDto;
    const resolvedPassword = password || this.buildInitialPassword(email);

    // Verifica se email já existe NESTA instituição
    const existingEmail = await this.prisma.user.findFirst({
      where: {
        email,
        institutionId,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Email já cadastrado nesta instituição');
    }

    // Verifica se CPF já existe NESTA instituição (se fornecido)
    if (cpf) {
      // Valida CPF
      if (!this.validateCPF(cpf)) {
        throw new BadRequestException('CPF inválido');
      }

      const existingCPF = await this.prisma.user.findFirst({
        where: {
          cpf,
          institutionId,
        },
      });

      if (existingCPF) {
        throw new ConflictException('CPF já cadastrado nesta instituição');
      }
    }

    // Verifica se instituição existe
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada');
    }

    if (!institution.isActive) {
      throw new BadRequestException('Instituição não está ativa');
    }

    // Hash da senha
    const rounds = this.configService.get<number>('bcrypt.rounds', 10);
    const hashedPassword = await bcrypt.hash(resolvedPassword, rounds);

    // Converte birthDate string para Date se fornecido
    const parsedBirthDate = birthDate ? new Date(birthDate) : null;

    // Combina firstName e lastName para criar name
    const fullName = `${firstName} ${lastName}`.trim();

    return this.prisma.user.create({
      data: {
        ...data,
        email,
        cpf,
        password: hashedPassword,
        birthDate: parsedBirthDate,
        institutionId,
        firstName,
        lastName,
        name: fullName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cpf: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Lista todos os usuários com paginação e filtros
   */
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    role?: UserRole,
    institutionId?: string,
    isActive?: boolean,
    hasTeacherProfile?: boolean,
    hasStudentProfile?: boolean,
    hasParentProfile?: boolean,
    hasProfile?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filtro geral: usuários com ou sem qualquer perfil
    if (hasProfile !== undefined) {
      if (hasProfile) {
        // Usuários que têm pelo menos um perfil
        where.OR = [
          { teacherProfile: { isNot: null } },
          { studentProfile: { isNot: null } },
          { parentProfile: { isNot: null } },
        ];
      } else {
        // Usuários sem nenhum perfil (pendentes)
        where.AND = [
          { teacherProfile: { is: null } },
          { studentProfile: { is: null } },
          { parentProfile: { is: null } },
        ];
      }
    }

    // Filtros por perfil específico
    if (hasTeacherProfile !== undefined) {
      where.teacherProfile = hasTeacherProfile ? { isNot: null } : { is: null };
    }

    if (hasStudentProfile !== undefined) {
      where.studentProfile = hasStudentProfile ? { isNot: null } : { is: null };
    }

    if (hasParentProfile !== undefined) {
      where.parentProfile = hasParentProfile ? { isNot: null } : { is: null };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          cpf: true,
          phone: true,
          birthDate: true,
          avatar: true,
          role: true,
          institutionId: true,
          isActive: true,
          requestedProfileType: true,
          createdAt: true,
          updatedAt: true,
          teacherProfile: {
            select: {
              id: true,
              userId: true,
              specialization: true,
              degree: true,
              registrationNumber: true,
              isActive: true,
            },
          },
          studentProfile: {
            select: {
              id: true,
              userId: true,
              registrationNumber: true,
              enrollmentNumber: true,
              isActive: true,
            },
          },
          parentProfile: {
            select: {
              id: true,
              userId: true,
              occupation: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Busca um usuário por ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cpf: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        teacherProfile: {
          select: {
            id: true,
            userId: true,
            specialization: true,
            degree: true,
            registrationNumber: true,
            isActive: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            userId: true,
            registrationNumber: true,
            enrollmentNumber: true,
            isActive: true,
          },
        },
        parentProfile: {
          select: {
            id: true,
            userId: true,
            occupation: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Busca usuário por email (usado para autenticação)
   */
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: {
        institution: true,
      },
    });
  }

  /**
   * Atualiza um usuário
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verifica se usuário existe
    const existingUser = await this.findOne(id);

    const { email, cpf, birthDate, firstName, lastName, ...data } = updateUserDto;

    // Verifica email único se fornecido NESTA instituição
    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email,
          institutionId: existingUser.institutionId,
        },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email já cadastrado nesta instituição');
      }
    }

    // Verifica CPF único se fornecido NESTA instituição
    if (cpf) {
      // Valida CPF
      if (!this.validateCPF(cpf)) {
        throw new BadRequestException('CPF inválido');
      }

      const existingCPF = await this.prisma.user.findFirst({
        where: {
          cpf,
          institutionId: existingUser.institutionId,
        },
      });

      if (existingCPF && existingCPF.id !== id) {
        throw new ConflictException('CPF já cadastrado nesta instituição');
      }
    }

    // Converte birthDate string para Date se fornecido
    const parsedBirthDate = birthDate ? new Date(birthDate) : undefined;

    // Atualiza name se firstName ou lastName foram fornecidos
    let fullName: string | undefined;
    if (firstName || lastName) {
      const newFirstName = firstName || existingUser.firstName;
      const newLastName = lastName || existingUser.lastName;
      fullName = `${newFirstName} ${newLastName}`.trim();
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        email,
        cpf,
        birthDate: parsedBirthDate,
        firstName,
        lastName,
        ...(fullName && { name: fullName }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cpf: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Remove um usuário (soft delete)
   */
  async remove(id: string) {
    // Verifica se usuário existe
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cpf: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Remove um usuário permanentemente
   */
  async removePermanently(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        authUserId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.authUserId) {
      try {
        const supabase = this.getSupabaseAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(user.authUserId);

        if (error && !/user not found/i.test(error.message)) {
          this.logger.error(
            `Falha ao remover usuário ${id} do Supabase Auth: ${error.message}`,
          );
          throw new BadRequestException(
            'Não foi possível remover o usuário no Supabase Auth.',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        this.logger.error(`Erro inesperado ao remover usuário ${id} do Supabase Auth`, error);
        throw new BadRequestException(
          'Não foi possível remover o usuário no Supabase Auth.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.updateMany({
        where: { sentById: id },
        data: { sentById: null },
      });

      await tx.lessonPlan.updateMany({
        where: { approvedById: id },
        data: { approvedById: null },
      });

      await tx.announcement.deleteMany({
        where: { createdById: id },
      });

      await tx.question.deleteMany({
        where: { createdById: id },
      });

      await tx.lessonPlan.deleteMany({
        where: { createdById: id },
      });

      await tx.user.delete({
        where: { id },
      });
    });

    return {
      message: 'Usuário excluído permanentemente com sucesso',
    };
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verifica senha atual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const rounds = this.configService.get<number>('bcrypt.rounds', 10);
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      rounds,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Atualiza avatar do usuário
   */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        institutionId: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de avatar inválido');
    }

    const supabase = this.getSupabaseAdminClient();
    const bucket = this.getAvatarBucketName();
    const storagePath = this.buildAvatarStoragePath(user, file);
    const previousStoragePath = this.extractStoragePathFromAvatarUrl(user.avatar);

    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      this.logger.error(`Falha ao enviar avatar para o Supabase Storage: ${uploadError.message}`);
      throw new BadRequestException('Nao foi possivel enviar o avatar para o armazenamento.');
    }

    const {
      data: { publicUrl: avatarUrl },
    } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
        },
      });
    } catch (error) {
      await supabase.storage.from(bucket).remove([storagePath]);
      throw error;
    }

    if (previousStoragePath && previousStoragePath !== storagePath) {
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove([previousStoragePath]);

      if (removeError) {
        this.logger.warn(
          `Falha ao remover avatar anterior do Supabase Storage: ${removeError.message}`,
        );
      }
    }

    return {
      message: 'Avatar atualizado com sucesso',
      avatar: avatarUrl,
    };
  }

  /**
   * Valida CPF
   */
  private validateCPF(cpf: string): boolean {
    // Remove formatação
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) {
      return false;
    }

    // Elimina CPFs inválidos conhecidos
    if (/^(\d)\1+$/.test(cpf)) {
      return false;
    }

    // Valida 1º dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    // Valida 2º dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  /**
   * Adiciona perfil de professor a um usuário
   */
  async addTeacherProfile(userId: string, data?: { specialization?: string; degree?: string; registrationNumber?: string }) {
    const user = await this.findOne(userId);

    if (user.teacherProfile) {
      throw new ConflictException('Usuário já possui perfil de professor');
    }

    return this.prisma.teacher.create({
      data: {
        userId,
        specialization: data?.specialization,
        degree: data?.degree,
        registrationNumber: data?.registrationNumber,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Adiciona perfil de aluno a um usuário
   */
  async addStudentProfile(userId: string, data?: { registrationNumber?: string; enrollmentNumber?: string; enrollmentDate?: Date }) {
    const user = await this.findOne(userId);

    if (user.studentProfile) {
      throw new ConflictException('Usuário já possui perfil de aluno');
    }

    return this.prisma.student.create({
      data: {
        userId,
        registrationNumber: data?.registrationNumber || `MAT-${Date.now()}`,
        enrollmentNumber: data?.enrollmentNumber,
        enrollmentDate: data?.enrollmentDate || new Date(),
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Adiciona perfil de responsável a um usuário
   */
  async addParentProfile(userId: string, data?: { occupation?: string }) {
    const user = await this.findOne(userId);

    if (user.parentProfile) {
      throw new ConflictException('Usuário já possui perfil de responsável');
    }

    return this.prisma.parent.create({
      data: {
        userId,
        occupation: data?.occupation,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Remove perfil de professor de um usuário
   */
  async removeTeacherProfile(userId: string) {
    const user = await this.findOne(userId);

    if (!user.teacherProfile) {
      throw new NotFoundException('Usuário não possui perfil de professor');
    }

    // Verificar se professor tem turmas ativas
    const activeClasses = await this.prisma.classSubject.count({
      where: { teacherId: user.teacherProfile.id },
    });

    if (activeClasses > 0) {
      throw new BadRequestException('Não é possível remover perfil de professor com turmas ativas');
    }

    return this.prisma.teacher.delete({
      where: { id: user.teacherProfile.id },
    });
  }

  /**
   * Remove perfil de aluno de um usuário
   */
  async removeStudentProfile(userId: string) {
    const user = await this.findOne(userId);

    if (!user.studentProfile) {
      throw new NotFoundException('Usuário não possui perfil de aluno');
    }

    // Verificar se aluno tem matrículas ativas
    const activeEnrollments = await this.prisma.classEnrollment.count({
      where: {
        studentId: user.studentProfile.id,
        isActive: true,
      },
    });

    if (activeEnrollments > 0) {
      throw new BadRequestException('Não é possível remover perfil de aluno com matrículas ativas');
    }

    return this.prisma.student.delete({
      where: { id: user.studentProfile.id },
    });
  }

  /**
   * Remove perfil de responsável de um usuário
   */
  async removeParentProfile(userId: string) {
    const user = await this.findOne(userId);

    if (!user.parentProfile) {
      throw new NotFoundException('Usuário não possui perfil de responsável');
    }

    // Verificar se responsável tem filhos vinculados
    const linkedStudents = await this.prisma.studentParent.count({
      where: { parentId: user.parentProfile.id },
    });

    if (linkedStudents > 0) {
      throw new BadRequestException('Não é possível remover perfil de responsável com alunos vinculados');
    }

    return this.prisma.parent.delete({
      where: { id: user.parentProfile.id },
    });
  }

  /**
   * Aprovação rápida de usuário pendente
   * Adiciona o perfil solicitado e notifica o usuário
   */
  async quickApprove(
    userId: string,
    profileType: 'TEACHER' | 'STUDENT' | 'PARENT',
    profileData: any = {},
    approvedById: string,
  ) {
    const user = await this.findOne(userId);

    // Nota: requestedProfileType feature foi removida do schema
    // Prosseguir diretamente com a criação do perfil

    // // Verifica se usuário está pendente
    // if (!user.requestedProfileType) {
    //   throw new BadRequestException('Usuário não possui solicitação de perfil pendente');
    // }

    // // Verifica se o perfil solicitado corresponde
    // if (user.requestedProfileType !== profileType) {
    //   throw new BadRequestException(
    //     `Tipo de perfil ${profileType} não corresponde ao solicitado: ${user.requestedProfileType}`,
    //   );
    // }

    // Adiciona o perfil apropriado
    let profile;
    switch (profileType) {
      case 'TEACHER':
        if (user.teacherProfile) {
          throw new ConflictException('Usuário já possui perfil de professor');
        }
        profile = await this.addTeacherProfile(userId, profileData);
        break;
      case 'STUDENT':
        if (user.studentProfile) {
          throw new ConflictException('Usuário já possui perfil de aluno');
        }
        profile = await this.addStudentProfile(userId, profileData);
        break;
      case 'PARENT':
        if (user.parentProfile) {
          throw new ConflictException('Usuário já possui perfil de responsável');
        }
        profile = await this.addParentProfile(userId, profileData);
        break;
      default:
        throw new BadRequestException('Tipo de perfil inválido');
    }

    // Remove o requestedProfileType após aprovação
    await this.prisma.user.update({
      where: { id: userId },
      data: { requestedProfileType: null },
    });

    // Notifica o usuário sobre a aprovação
    await this.notificationsService.notifyUserApproved(
      userId,
      profileType,
      approvedById,
    );

    return {
      message: 'Usuário aprovado com sucesso',
      user: await this.findOne(userId),
      profile,
    };
  }

  /**
   * Aprovação em massa de usuários pendentes
   */
  async bulkApprove(
    approvals: Array<{
      userId: string;
      profileType: 'TEACHER' | 'STUDENT' | 'PARENT';
      profileData?: any;
    }>,
    approvedById: string,
  ) {
    const results = {
      approved: [] as any[],
      failed: [] as any[],
    };

    for (const approval of approvals) {
      try {
        const result = await this.quickApprove(
          approval.userId,
          approval.profileType,
          approval.profileData || {},
          approvedById,
        );
        results.approved.push({
          userId: approval.userId,
          ...result,
        });
      } catch (error) {
        results.failed.push({
          userId: approval.userId,
          error: error.message,
        });
      }
    }

    return results;
  }
}
