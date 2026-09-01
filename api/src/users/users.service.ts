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

  private buildInitialPassword(cpf?: string | null) {
    const digits = String(cpf ?? '').replace(/\D/g, '');
    return digits.length >= 6 ? digits.slice(0, 6) : null;
  }

  private getAvatarBucketName() {
    return this.configService.get<string>('storage.avatarsBucket', 'avatars');
  }

  private getSupabaseAdminClient(): SupabaseClient {
    const supabaseUrl = this.configService
      .get<string>('storage.supabaseUrl')
      ?.trim();
    const serviceRoleKey = this.configService
      .get<string>('storage.serviceRoleKey')
      ?.trim();

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

  private async getAllowedInstitutionIds(currentUser: {
    userId: string;
    role: UserRole;
    institutionId?: string | null;
  }) {
    const links = await this.prisma.userInstitution.findMany({
      where: { userId: currentUser.userId, isActive: true },
      select: { institutionId: true },
    });

    return Array.from(
      new Set(
        [
          currentUser.institutionId,
          ...links.map((link) => link.institutionId),
        ].filter((value): value is string => Boolean(value)),
      ),
    );
  }

  private async ensureCanAccessUser(
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
    targetUser: { id: string; institutionId?: string | null },
  ) {
    if (currentUser.userId === targetUser.id) {
      return;
    }

    if (currentUser.role === UserRole.SUPER_ADMIN_GLOBAL) {
      return;
    }

    const institutionalViewerRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.DIRECTOR,
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
    ];

    if (institutionalViewerRoles.includes(currentUser.role)) {
      const allowedInstitutionIds =
        await this.getAllowedInstitutionIds(currentUser);

      if (
        targetUser.institutionId &&
        allowedInstitutionIds.includes(targetUser.institutionId)
      ) {
        return;
      }
    }

    if (currentUser.role === UserRole.PARENT) {
      // Responsáveis podem consultar somente usuários dos alunos vinculados
      // ao seu próprio perfil. O vínculo é conferido pelo grafo acadêmico,
      // evitando que um ID de outro aluno seja usado para obter dados privados.
      const linkedStudent = await this.prisma.studentParent.findFirst({
        where: {
          parent: { userId: currentUser.userId },
          student: { userId: targetUser.id },
        },
        select: { id: true },
      });

      if (linkedStudent) {
        return;
      }
    }

    throw new ForbiddenException('Acesso negado a este usuário');
  }

  async assertCanAccessUser(
    id: string,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, institutionId: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.ensureCanAccessUser(currentUser, targetUser);
  }

  private buildAvatarStoragePath(
    user: { id: string; institutionId?: string | null },
    file: Express.Multer.File,
  ) {
    const extension = this.getAvatarExtension(file);
    const basePath = user.institutionId
      ? `institutions/${user.institutionId}`
      : 'global';

    return `${basePath}/users/${user.id}/avatar-${Date.now()}${extension}`;
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
  async create(
    createUserDto: CreateUserDto,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    const {
      email,
      cpf,
      password,
      birthDate,
      institutionId,
      institutionIds: additionalInstitutionIds = [],
      unitIds = [],
      firstName,
      lastName,
      ...data
    } = createUserDto;

    const requestedInstitutionIds = Array.from(
      new Set(
        [institutionId, ...(additionalInstitutionIds ?? [])].filter(Boolean),
      ),
    );

    if (currentUser.role !== UserRole.SUPER_ADMIN_GLOBAL) {
      const allowedInstitutionIds =
        await this.getAllowedInstitutionIds(currentUser);
      if (
        requestedInstitutionIds.some(
          (requestedId) => !allowedInstitutionIds.includes(requestedId),
        )
      ) {
        throw new ForbiddenException(
          'Você só pode cadastrar usuários nas suas instituições.',
        );
      }

      const elevatedRoles: UserRole[] = [
        UserRole.SUPER_ADMIN_GLOBAL,
        UserRole.SUPER_ADMIN,
        UserRole.DIRECTOR,
        UserRole.INSTITUTION_ADMIN,
      ];
      if (
        data.role &&
        elevatedRoles.includes(data.role) &&
        currentUser.role !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'Seu perfil não pode criar usuários com esse nível de acesso.',
        );
      }
    }
    const normalizedCpf =
      typeof cpf === 'string' ? cpf.replace(/\D/g, '') : cpf;
    const resolvedPassword =
      password?.trim() || this.buildInitialPassword(normalizedCpf);

    if (!resolvedPassword) {
      throw new BadRequestException(
        'Informe um CPF válido para gerar a senha padrão do primeiro acesso ou defina uma senha personalizada.',
      );
    }

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
    if (normalizedCpf) {
      // Valida CPF
      if (!this.validateCPF(normalizedCpf)) {
        throw new BadRequestException('CPF inválido');
      }

      const existingCPF = await this.prisma.user.findFirst({
        where: {
          cpf: normalizedCpf,
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

    if (requestedInstitutionIds.length > 1) {
      const activeInstitutions = await this.prisma.institution.findMany({
        where: { id: { in: requestedInstitutionIds }, isActive: true },
        select: { id: true },
      });
      if (activeInstitutions.length !== requestedInstitutionIds.length) {
        throw new BadRequestException(
          'Uma ou mais instituições selecionadas não foram encontradas ou estão inativas',
        );
      }
    }

    const requestedUnitIds = Array.from(new Set(unitIds ?? []));
    if (requestedUnitIds.length > 0) {
      const activeUnits = await this.prisma.institutionUnit.findMany({
        where: {
          id: { in: requestedUnitIds },
          isActive: true,
          institutionId: { in: requestedInstitutionIds },
        },
        select: { id: true },
      });
      if (activeUnits.length !== requestedUnitIds.length) {
        throw new BadRequestException(
          'Um ou mais anexos selecionados não pertencem às instituições escolhidas ou estão inativos',
        );
      }
    }

    // Hash da senha
    const rounds = this.configService.get<number>('bcrypt.rounds', 10);
    const hashedPassword = await bcrypt.hash(resolvedPassword, rounds);

    // Converte birthDate string para Date se fornecido
    const parsedBirthDate = birthDate ? new Date(birthDate) : null;

    // Combina firstName e lastName para criar name
    const fullName = `${firstName} ${lastName}`.trim();

    const createdUser = await this.prisma.user.create({
      data: {
        ...data,
        email,
        cpf: normalizedCpf,
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

    if (requestedInstitutionIds.length > 0) {
      await this.prisma.userInstitution.createMany({
        data: requestedInstitutionIds.map((requestedId) => ({
          userId: createdUser.id,
          institutionId: requestedId,
          isActive: true,
          isPrimary: requestedId === institutionId,
        })),
        skipDuplicates: true,
      });
    }

    if (requestedUnitIds.length > 0) {
      await this.prisma.userUnit.createMany({
        data: requestedUnitIds.map((requestedUnitId, index) => ({
          userId: createdUser.id,
          unitId: requestedUnitId,
          isActive: true,
          isPrimary: index === 0,
        })),
        skipDuplicates: true,
      });
    }

    return createdUser;
  }

  /**
   * Lista todos os usuários com paginação e filtros
   */
  async findAll(
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
    page = 1,
    limit = 20,
    search?: string,
    role?: UserRole,
    institutionId?: string,
    institutionIds?: string[],
    unitId?: string,
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

    const isGlobalAdmin = currentUser.role === UserRole.SUPER_ADMIN_GLOBAL;

    if (unitId) {
      const requestedUnit = await this.prisma.institutionUnit.findUnique({
        where: { id: unitId },
        select: { institutionId: true, isActive: true },
      });

      if (!requestedUnit?.isActive) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
        };
      }

      if (!isGlobalAdmin) {
        const unitIsAllowed = await this.prisma.userUnit.findFirst({
          where: {
            userId: currentUser.userId,
            unitId,
            isActive: true,
          },
          select: { id: true },
        });

        if (!unitIsAllowed) {
          return {
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: page > 1,
            },
          };
        }
      }

      where.userUnits = {
        some: { unitId, isActive: true },
      };
    }

    if (!isGlobalAdmin) {
      const links = await this.prisma.userInstitution.findMany({
        where: { userId: currentUser.userId, isActive: true },
        select: { institutionId: true },
      });

      const allowed = Array.from(
        new Set(
          [
            currentUser.institutionId,
            ...links.map((link) => link.institutionId),
          ].filter((value): value is string => Boolean(value)),
        ),
      );

      const requested = Array.from(
        new Set(
          [
            ...(institutionIds ?? []),
            ...(institutionId ? [institutionId] : []),
          ].filter(Boolean),
        ),
      );

      const effective =
        requested.length > 0
          ? requested.filter((value) => allowed.includes(value))
          : allowed.length > 0 && currentUser.institutionId
            ? [currentUser.institutionId]
            : allowed;

      if (effective.length > 0) {
        where.institutionId = { in: effective };
      } else {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
        };
      }
    } else {
      const requested = Array.from(
        new Set(
          [
            ...(institutionIds ?? []),
            ...(institutionId ? [institutionId] : []),
          ].filter(Boolean),
        ),
      );

      if (requested.length > 0) {
        where.institutionId = { in: requested };
      }
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

    // A listagem não deve depender de todas as colunas opcionais dos perfis.
    // O banco pode estar sendo atualizado pelo CI enquanto a API continua
    // atendendo requisições; por isso carregamos primeiro apenas os campos
    // essenciais de users e depois anexamos um resumo dos perfis.
    const [baseData, total] = await Promise.all([
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
          whatsapp: true,
          birthDate: true,
          avatar: true,
          role: true,
          institutionId: true,
          isActive: true,
          requestedProfileType: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const teacherProfiles = new Map<string, any>();
    const studentProfiles = new Map<string, any>();
    const parentProfiles = new Map<string, any>();

    try {
      const userIds = baseData.map((user) => user.id);

      if (userIds.length > 0) {
        const [teachers, students, parents] = await Promise.all([
          this.prisma.teacher.findMany({
            where: { userId: { in: userIds } },
            select: {
              id: true,
              userId: true,
              specialization: true,
              degree: true,
              registrationNumber: true,
              hireDate: true,
              isActive: true,
            },
          }),
          this.prisma.student.findMany({
            where: { userId: { in: userIds } },
            select: {
              id: true,
              userId: true,
              registrationNumber: true,
              enrollmentNumber: true,
              enrollmentDate: true,
              situacao: true,
              anoLetivo: true,
              curso: true,
              serie: true,
              turma: true,
              turno: true,
              isActive: true,
            },
          }),
          this.prisma.parent.findMany({
            where: { userId: { in: userIds } },
            select: {
              id: true,
              userId: true,
              occupation: true,
              isActive: true,
            },
          }),
        ]);

        for (const profile of teachers)
          teacherProfiles.set(profile.userId, profile);
        for (const profile of students)
          studentProfiles.set(profile.userId, profile);
        for (const profile of parents)
          parentProfiles.set(profile.userId, profile);
      }
    } catch (error) {
      // A profile ausente ou uma coluna opcional incompatível não pode
      // impedir a listagem dos usuários. O detalhe fica no log da API para
      // diagnóstico, mas a resposta principal continua utilizável.
      this.logger.warn(
        `Não foi possível carregar o resumo dos perfis na listagem: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const data = baseData.map((user) => ({
      ...user,
      teacherProfile: teacherProfiles.get(user.id),
      studentProfile: studentProfiles.get(user.id),
      parentProfile: parentProfiles.get(user.id),
    }));

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
  async findOne(
    id: string,
    currentUser?: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cpf: true,
        socialName: true,
        phone: true,
        whatsapp: true,
        telefoneFixo: true,
        birthDate: true,
        gender: true,
        avatar: true,
        address: true,
        numero: true,
        complemento: true,
        bairro: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        institutionId: true,
        isActive: true,
        emailVerified: true,
        requestedProfileType: true,
        createdAt: true,
        updatedAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        userUnits: {
          where: { isActive: true },
          select: {
            id: true,
            unitId: true,
            isActive: true,
            isPrimary: true,
            unit: {
              select: {
                id: true,
                name: true,
                institutionId: true,
              },
            },
          },
        },
        teacherProfile: {
          select: {
            id: true,
            userId: true,
            specialization: true,
            degree: true,
            registrationNumber: true,
            hireDate: true,
            isActive: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            userId: true,
            registrationNumber: true,
            enrollmentNumber: true,
            enrollmentDate: true,
            situacao: true,
            escola: true,
            unidade: true,
            anoLetivo: true,
            curso: true,
            serie: true,
            turma: true,
            modalidade: true,
            turno: true,
            observacoes: true,
            documents: true,
            isActive: true,
            healthRecord: true,
            transportation: true,
            parents: {
              select: {
                id: true,
                studentId: true,
                parentId: true,
                relationship: true,
                isPrimary: true,
                receivesNotifications: true,
                canPickup: true,
                parent: {
                  select: {
                    id: true,
                    userId: true,
                    occupation: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        cpf: true,
                        email: true,
                        phone: true,
                        whatsapp: true,
                        birthDate: true,
                      },
                    },
                  },
                },
              },
            },
            classEnrollments: {
              where: { isActive: true },
              orderBy: { enrollmentDate: 'desc' },
              select: {
                id: true,
                classId: true,
                status: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                    academicYearId: true,
                  },
                },
              },
            },
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

    if (currentUser) {
      await this.ensureCanAccessUser(currentUser, user);
    }

    return user;
  }

  /**
   * Busca usuário por email (usado para autenticação)
   */
  findByEmail(email: string) {
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
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    // Verifica se usuário existe
    const existingUser = await this.findOne(id, currentUser);

    const {
      email,
      cpf,
      birthDate,
      firstName,
      lastName,
      state,
      institutionId,
      institutionIds,
      unitIds,
      ...data
    } = updateUserDto;

    // O e-mail usado no login pertence ao Supabase Auth e o e-mail exibido
    // pela aplicação pertence a public.users. Os dois registros precisam ser
    // alterados juntos; caso contrário, a tela mostra o e-mail novo, mas o
    // login continua aceitando apenas o antigo.
    const normalizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : email;
    const authIdentity = await this.prisma.user.findUnique({
      where: { id },
      select: { authUserId: true, email: true },
    });
    const currentEmail = authIdentity?.email?.trim().toLowerCase();
    const emailChanged =
      typeof normalizedEmail === 'string' &&
      normalizedEmail.length > 0 &&
      normalizedEmail !== currentEmail;

    let authEmailUpdated = false;
    let shouldRefreshInitialPassword = false;

    const isGlobalAdmin = currentUser.role === UserRole.SUPER_ADMIN_GLOBAL;
    const canManageRoles =
      isGlobalAdmin || currentUser.role === UserRole.SUPER_ADMIN;

    if (data.role && data.role !== existingUser.role && !canManageRoles) {
      throw new ForbiddenException(
        'Somente administradores globais podem alterar o cargo de um usuário',
      );
    }

    const shouldSyncInstitutionLinks =
      institutionId !== undefined || institutionIds !== undefined;
    const shouldSyncUnitLinks = unitIds !== undefined;
    const primaryInstitutionId = institutionId ?? existingUser.institutionId;
    const requestedInstitutionIds = shouldSyncInstitutionLinks
      ? Array.from(
          new Set([primaryInstitutionId, ...(institutionIds ?? [])]),
        ).filter((value): value is string => Boolean(value))
      : [];

    if (shouldSyncInstitutionLinks) {
      if (!primaryInstitutionId || requestedInstitutionIds.length === 0) {
        throw new BadRequestException(
          'O usuário precisa estar vinculado a pelo menos uma instituição',
        );
      }

      if (!isGlobalAdmin) {
        const allowedInstitutionIds =
          await this.getAllowedInstitutionIds(currentUser);
        const hasUnauthorizedInstitution = requestedInstitutionIds.some(
          (requestedId) => !allowedInstitutionIds.includes(requestedId),
        );

        if (hasUnauthorizedInstitution) {
          throw new ForbiddenException(
            'Você não tem permissão para vincular este usuário a uma das instituições selecionadas',
          );
        }
      }

      const activeInstitutions = await this.prisma.institution.findMany({
        where: {
          id: { in: requestedInstitutionIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (activeInstitutions.length !== requestedInstitutionIds.length) {
        throw new BadRequestException(
          'Uma ou mais instituições selecionadas não foram encontradas ou estão inativas',
        );
      }
    }

    const requestedUnitIds = shouldSyncUnitLinks
      ? Array.from(new Set(unitIds ?? []))
      : [];
    if (shouldSyncUnitLinks && requestedUnitIds.length > 0) {
      const unitInstitutionIds = shouldSyncInstitutionLinks
        ? requestedInstitutionIds
        : [existingUser.institutionId].filter((value): value is string =>
            Boolean(value),
          );

      if (unitInstitutionIds.length === 0) {
        throw new BadRequestException(
          'Os anexos selecionados precisam estar vinculados a uma instituição',
        );
      }

      if (!isGlobalAdmin) {
        const allowedInstitutionIds =
          await this.getAllowedInstitutionIds(currentUser);
        if (
          unitInstitutionIds.some(
            (requestedId) => !allowedInstitutionIds.includes(requestedId),
          )
        ) {
          throw new ForbiddenException(
            'Você não tem permissão para vincular anexos fora das suas instituições',
          );
        }
      }

      const activeUnits = await this.prisma.institutionUnit.findMany({
        where: {
          id: { in: requestedUnitIds },
          isActive: true,
          institutionId: { in: unitInstitutionIds },
        },
        select: { id: true },
      });

      if (activeUnits.length !== requestedUnitIds.length) {
        throw new BadRequestException(
          'Um ou mais anexos selecionados não foram encontrados, estão inativos ou não pertencem às instituições escolhidas',
        );
      }
    }

    // Verifica email único se fornecido NESTA instituição
    if (normalizedEmail) {
      const existingEmail = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM public.users
        WHERE LOWER(email) = LOWER(${normalizedEmail})
          AND (
            ("institutionId" = ${existingUser.institutionId})
            OR (${existingUser.institutionId} IS NULL AND "institutionId" IS NULL)
          )
        LIMIT 1
      `;

      if (existingEmail[0] && existingEmail[0].id !== id) {
        throw new ConflictException('Email já cadastrado nesta instituição');
      }
    }

    // A tela de edição pode reenviar o CPF já salvo junto com outros campos.
    // Só validamos o documento quando ele realmente foi alterado, evitando
    // que um cadastro legado com CPF inválido impeça mudanças no perfil.
    const normalizedCpf =
      typeof cpf === 'string' ? cpf.replace(/\D/g, '') : cpf;
    const existingCpf =
      typeof existingUser.cpf === 'string'
        ? existingUser.cpf.replace(/\D/g, '')
        : existingUser.cpf;
    const cpfChanged =
      cpf !== undefined && (normalizedCpf || null) !== (existingCpf || null);

    // Verifica CPF único se ele foi alterado nesta instituição
    if (cpfChanged && normalizedCpf) {
      if (!this.validateCPF(normalizedCpf)) {
        throw new BadRequestException('CPF inválido');
      }

      const existingCPF = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM public.users
        WHERE cpf = ${normalizedCpf}
          AND (
            ("institutionId" = ${existingUser.institutionId})
            OR (${existingUser.institutionId} IS NULL AND "institutionId" IS NULL)
          )
        LIMIT 1
      `;

      if (existingCPF[0] && existingCPF[0].id !== id) {
        throw new ConflictException('CPF já cadastrado nesta instituição');
      }
    }

    // Só altera o Auth depois de concluir todas as validações locais. Assim,
    // um CPF/email duplicado ou uma instituição inválida nunca deixa uma
    // alteração parcial no login.
    if (emailChanged) {
      if (!authIdentity?.authUserId) {
        throw new BadRequestException(
          'Este usuário não possui uma conta de acesso vinculada. Não foi possível alterar o email de login.',
        );
      }

      const supabase = this.getSupabaseAdminClient();
      const { data: authUserResult, error: authUserLookupError } =
        await supabase.auth.admin.getUserById(authIdentity.authUserId);

      if (authUserLookupError || !authUserResult.user) {
        this.logger.warn(
          `Não foi possível verificar o primeiro acesso do usuário ${id} durante a alteração de email. A senha atual será preservada.`,
        );
      } else {
        // A senha padrão do primeiro acesso é derivada do CPF.
        // Só a regeneramos enquanto o usuário ainda não trocou a senha;
        // usuários que já definiram uma senha pessoal não são afetados.
        shouldRefreshInitialPassword = Boolean(
          authUserResult.user.user_metadata?.mustChangePassword,
        );
      }

      const { error: authEmailError } =
        await supabase.auth.admin.updateUserById(authIdentity.authUserId, {
          email: normalizedEmail,
          email_confirm: true,
        });

      if (authEmailError) {
        if (
          /already|registered|exists|duplicate|unique/i.test(
            authEmailError.message,
          )
        ) {
          throw new ConflictException('Este email já está cadastrado.');
        }

        this.logger.error(
          `Falha ao atualizar o email de login do usuário ${id}: ${authEmailError.message}`,
        );
        throw new InternalServerErrorException(
          'Não foi possível atualizar o email de acesso agora. Tente novamente.',
        );
      }

      authEmailUpdated = true;
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

    try {
      const updatedUser = await this.prisma.$transaction(
        async (transaction) => {
          const updatedUser = await transaction.user.update({
            where: { id },
            data: {
              ...data,
              email: normalizedEmail,
              cpf: normalizedCpf,
              birthDate: parsedBirthDate,
              firstName,
              lastName,
              state: state?.toUpperCase(),
              ...(emailChanged ? { emailVerified: true } : {}),
              ...(institutionId !== undefined ? { institutionId } : {}),
              ...(fullName && { name: fullName }),
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              cpf: true,
              phone: true,
              whatsapp: true,
              birthDate: true,
              avatar: true,
              role: true,
              institutionId: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (shouldSyncInstitutionLinks) {
            await transaction.userInstitution.deleteMany({
              where: { userId: id },
            });
            await transaction.userInstitution.createMany({
              data: requestedInstitutionIds.map((requestedId) => ({
                userId: id,
                institutionId: requestedId,
                isActive: true,
                isPrimary: requestedId === primaryInstitutionId,
              })),
            });
          }

          if (shouldSyncUnitLinks) {
            await transaction.userUnit.deleteMany({
              where: { userId: id },
            });

            if (requestedUnitIds.length > 0) {
              await transaction.userUnit.createMany({
                data: requestedUnitIds.map((requestedUnitId, index) => ({
                  userId: id,
                  unitId: requestedUnitId,
                  isActive: true,
                  isPrimary: index === 0,
                })),
              });
            }
          }

          return updatedUser;
        },
      );

      if (
        emailChanged &&
        shouldRefreshInitialPassword &&
        authIdentity?.authUserId
      ) {
        const supabase = this.getSupabaseAdminClient();
        const initialPassword = this.buildInitialPassword(
          normalizedCpf ?? existingUser.cpf,
        );
        if (!initialPassword) {
          this.logger.warn(
            `Não foi possível regenerar a senha inicial do usuário ${id}: CPF ausente ou inválido.`,
          );
          return updatedUser;
        }
        const { error: authPasswordError } =
          await supabase.auth.admin.updateUserById(authIdentity.authUserId, {
            password: initialPassword,
          });

        if (authPasswordError) {
          // O email e o registro público já estão sincronizados. Nesse caso,
          // preservamos a senha anterior para não bloquear o acesso; o usuário
          // ainda poderá usar "Resetar senha" ou a senha antiga.
          this.logger.error(
            `Email sincronizado, mas não foi possível regenerar a senha inicial do usuário ${id}: ${authPasswordError.message}`,
          );
        }
      }

      return updatedUser;
    } catch (error) {
      // Se o Auth foi alterado e a gravação no banco falhou, tenta restaurar
      // o e-mail anterior para não deixar os dois lados divergentes.
      if (authEmailUpdated && authIdentity?.authUserId && currentEmail) {
        try {
          const supabase = this.getSupabaseAdminClient();
          await supabase.auth.admin.updateUserById(authIdentity.authUserId, {
            email: currentEmail,
            email_confirm: true,
          });
        } catch (rollbackError) {
          this.logger.error(
            `Falha ao desfazer o email do Auth após erro no banco para o usuário ${id}.`,
            rollbackError instanceof Error
              ? rollbackError.stack
              : String(rollbackError),
          );
        }
      }

      throw error;
    }
  }

  /**
   * Remove um usuário (soft delete)
   */
  async remove(
    id: string,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    // Verifica se usuário existe
    await this.assertCanAccessUser(id, currentUser);

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
  async removePermanently(
    id: string,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    await this.assertCanAccessUser(id, currentUser);
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

    // Usa SQL direto porque o delete puro no banco funciona, enquanto o fluxo
    // via Prisma Client tem falhado no ambiente com pooler/produção.
    await this.prisma.$executeRaw`
      UPDATE public.notifications
      SET "sentById" = NULL
      WHERE "sentById" = ${id}
    `;

    await this.prisma.$executeRaw`
      UPDATE public.lesson_plans
      SET "approvedById" = NULL
      WHERE "approvedById" = ${id}
    `;

    await this.prisma.$executeRaw`
      DELETE FROM public.announcements
      WHERE "createdById" = ${id}
    `;

    await this.prisma.$executeRaw`
      DELETE FROM public.questions
      WHERE "createdById" = ${id}
    `;

    await this.prisma.$executeRaw`
      DELETE FROM public.lesson_plans
      WHERE "createdById" = ${id}
    `;

    const deletedUsers = await this.prisma.$executeRaw`
      DELETE FROM public.users
      WHERE id = ${id}
    `;

    if (!deletedUsers) {
      throw new NotFoundException('Usuário não encontrado ou já foi removido');
    }

    if (user.authUserId) {
      try {
        const supabase = this.getSupabaseAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(user.authUserId);

        if (error && !/user not found/i.test(error.message)) {
          this.logger.error(
            `Falha ao remover usuário ${id} do Supabase Auth após exclusão local: ${error.message}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro inesperado ao remover usuário ${id} do Supabase Auth após exclusão local`,
          error,
        );
      }
    }

    return {
      message: 'Usuário excluído permanentemente com sucesso',
    };
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
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
  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    // Reutiliza a mesma autorização institucional usada na leitura de usuários.
    // Isso permite que Diretor/Coordenador atualizem usuários da sua instituição,
    // mas impede acesso a usuários de outra instituição.
    const user = await this.findOne(userId, currentUser);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de avatar inválido');
    }

    const supabase = this.getSupabaseAdminClient();
    const bucket = this.getAvatarBucketName();
    const storagePath = this.buildAvatarStoragePath(user, file);
    const previousStoragePath = this.extractStoragePathFromAvatarUrl(
      user.avatar,
    );

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(
        `Falha ao enviar avatar para o Supabase Storage: ${uploadError.message}`,
      );
      throw new BadRequestException(
        'Nao foi possivel enviar o avatar para o armazenamento.',
      );
    }

    const {
      data: { publicUrl: avatarUrl },
    } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    try {
      const updatedRows = await this.prisma.$executeRaw`
        UPDATE public.users
        SET avatar = ${avatarUrl},
            "updatedAt" = NOW()
        WHERE id = ${userId}
      `;

      if (!updatedRows) {
        throw new NotFoundException('Usuário não encontrado');
      }
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

  async deleteAvatar(
    userId: string,
    currentUser: {
      userId: string;
      role: UserRole;
      institutionId?: string | null;
    },
  ) {
    const user = await this.findOne(userId, currentUser);
    const previousStoragePath = this.extractStoragePathFromAvatarUrl(
      user.avatar,
    );

    if (previousStoragePath) {
      const supabase = this.getSupabaseAdminClient();
      const bucket = this.getAvatarBucketName();
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove([previousStoragePath]);

      if (removeError) {
        this.logger.warn(
          'Falha ao remover avatar do Supabase Storage: ' + removeError.message,
        );
      }
    }

    const updatedRows = await this.prisma.$executeRawUnsafe(
      'UPDATE public.users SET avatar = NULL, "updatedAt" = NOW() WHERE id = $1',
      userId,
    );

    if (!updatedRows) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      message: 'Foto removida com sucesso',
      avatar: null,
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
  async addTeacherProfile(
    userId: string,
    data?: {
      specialization?: string;
      degree?: string;
      registrationNumber?: string;
    },
  ) {
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
  async addStudentProfile(
    userId: string,
    data?: {
      registrationNumber?: string;
      enrollmentNumber?: string;
      enrollmentDate?: Date;
    },
  ) {
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
      throw new BadRequestException(
        'Não é possível remover perfil de professor com turmas ativas',
      );
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
      throw new BadRequestException(
        'Não é possível remover perfil de aluno com matrículas ativas',
      );
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
      throw new BadRequestException(
        'Não é possível remover perfil de responsável com alunos vinculados',
      );
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
          throw new ConflictException(
            'Usuário já possui perfil de responsável',
          );
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
