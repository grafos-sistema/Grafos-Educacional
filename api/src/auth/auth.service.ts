import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto, PublicRegisterDto } from './dto';
import { UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Registra um novo usuário (auto-registro público)
   */
  async publicRegister(publicRegisterDto: PublicRegisterDto) {
    const { email, password, institutionId, requestedProfileType, cpf, birthDate, ...userData } = publicRegisterDto;

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

    // Verifica se instituição existe e está ativa
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
    const hashedPassword = await this.hashPassword(password);

    // Define role padrão baseado no tipo de perfil solicitado
    // Usuário inicia com o role mas SEM o perfil correspondente
    // Admin precisa aprovar e adicionar o perfil depois
    let defaultRole: UserRole;
    switch (requestedProfileType) {
      case 'TEACHER':
        defaultRole = UserRole.TEACHER;
        break;
      case 'STUDENT':
        defaultRole = UserRole.STUDENT;
        break;
      case 'PARENT':
        defaultRole = UserRole.PARENT;
        break;
      default:
        defaultRole = UserRole.STUDENT; // Fallback
    }

    // Converte birthDate string para Date se fornecido
    const parsedBirthDate = birthDate ? new Date(birthDate) : null;

    // Cria o usuário
    const user = await this.prisma.user.create({
      data: {
        name: `${publicRegisterDto.firstName} ${publicRegisterDto.lastName}`,
        email,
        password: hashedPassword,
        role: defaultRole,
        institutionId,
        requestedProfileType, // Armazena o tipo solicitado
        cpf,
        birthDate: parsedBirthDate,
        isActive: true, // Usuário pode fazer login imediatamente
        emailVerified: false, // Email não verificado
        ...userData,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        institutionId: true,
        requestedProfileType: true,
        createdAt: true,
      },
    });

    // Notifica admins sobre novo cadastro pendente
    await this.notificationsService.notifyPendingApproval(user.id, institutionId);

    // Gera tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.institutionId);

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Registra um novo usuário (admin cria)
   */
  async register(registerDto: RegisterDto) {
    const { email, password, institutionId, role, ...userData } = registerDto;

    // Verifica se email já existe NESTA instituição
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email,
        institutionId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta instituição');
    }

    // Verifica se instituição existe
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Instituição não encontrada');
    }

    // Hash da senha
    const hashedPassword = await this.hashPassword(password);

    // Cria o usuário
    const user = await this.prisma.user.create({
      data: {
        name: `${registerDto.firstName} ${registerDto.lastName}`,
        email,
        password: hashedPassword,
        role,
        institutionId,
        ...userData,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        institutionId: true,
        createdAt: true,
      },
    });

    // Gera tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.institutionId);

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Realiza login do usuário
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Busca usuário pelo email (pode haver múltiplos com mesmo email em instituições diferentes)
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Verifica se usuário está ativo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Verifica se instituição está ativa
    if (!user.institution.isActive) {
      throw new UnauthorizedException('Instituição inativa');
    }

    // Valida senha
    const isPasswordValid = await this.validatePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Gera tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.institutionId,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institutionId: user.institutionId,
      },
    };
  }

  /**
   * Atualiza o access token usando o refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verifica e decodifica o refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Busca usuário
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      // Gera novos tokens
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.institutionId,
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  /**
   * Gera access token e refresh token
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    institutionId: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      institutionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret',
        expiresIn: (this.configService.get<string>('jwt.expiresIn') || '1d') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Gera hash da senha
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('security.bcryptRounds') || 10;
    return bcrypt.hash(password, rounds);
  }

  /**
   * Valida senha
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Valida se um token JWT é válido
   */
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Obtém o perfil completo do usuário com instituições
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        institutionId: true,
        avatar: true,
        phone: true,
        cpf: true,
        birthDate: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
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
            logo: true,
            isActive: true,
          },
        },
        teacherProfile: {
          select: {
            id: true,
            specialization: true,
            degree: true,
            registrationNumber: true,
            isActive: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            registrationNumber: true,
            enrollmentNumber: true,
            isActive: true,
          },
        },
        parentProfile: {
          select: {
            id: true,
            occupation: true,
            isActive: true,
          },
        },
        userInstitutions: {
          where: { isActive: true },
          include: {
            institution: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                isActive: true,
              },
            },
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Lista as instituições do usuário
   */
  async getUserInstitutions(userId: string) {
    // Primeiro busca a instituição principal do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Busca instituições adicionais
    const additionalInstitutions = await this.prisma.userInstitution.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isActive: true,
          },
        },
      },
    });

    // Combina a instituição principal com as adicionais
    const institutions = [
      {
        ...user.institution,
        isPrimary: true,
        isCurrent: true,
      },
      ...additionalInstitutions
        .filter((ui) => ui.institutionId !== user.institutionId)
        .map((ui) => ({
          ...ui.institution,
          isPrimary: ui.isPrimary,
          isCurrent: false,
        })),
    ];

    return institutions;
  }

  /**
   * Troca a instituição ativa do usuário
   */
  async switchInstitution(userId: string, institutionId: string) {
    // Busca o usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verifica se a instituição é a principal
    if (user.institutionId === institutionId) {
      // Gera novos tokens
      return this.generateTokens(user.id, user.email, user.role, institutionId);
    }

    // Verifica se o usuário tem acesso à instituição
    const userInstitution = await this.prisma.userInstitution.findFirst({
      where: {
        userId,
        institutionId,
        isActive: true,
      },
      include: {
        institution: true,
      },
    });

    if (!userInstitution) {
      throw new UnauthorizedException('Usuário não tem acesso a esta instituição');
    }

    if (!userInstitution.institution.isActive) {
      throw new UnauthorizedException('Instituição não está ativa');
    }

    // Gera novos tokens com a nova instituição
    return this.generateTokens(user.id, user.email, user.role, institutionId);
  }

  /**
   * Adiciona uma instituição ao usuário
   */
  async addUserInstitution(
    userId: string,
    institutionId: string,
    isPrimary: boolean = false,
  ) {
    // Verifica se já existe o vínculo
    const existing = await this.prisma.userInstitution.findFirst({
      where: { userId, institutionId },
    });

    if (existing) {
      // Atualiza se existir
      return this.prisma.userInstitution.update({
        where: { id: existing.id },
        data: { isActive: true, isPrimary },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      });
    }

    // Cria novo vínculo
    return this.prisma.userInstitution.create({
      data: {
        userId,
        institutionId,
        isPrimary,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
  }

  /**
   * Remove uma instituição do usuário
   */
  async removeUserInstitution(userId: string, institutionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Não permite remover a instituição principal
    if (user.institutionId === institutionId) {
      throw new BadRequestException(
        'Não é possível remover a instituição principal do usuário',
      );
    }

    const userInstitution = await this.prisma.userInstitution.findFirst({
      where: { userId, institutionId },
    });

    if (!userInstitution) {
      throw new NotFoundException('Vínculo não encontrado');
    }

    return this.prisma.userInstitution.update({
      where: { id: userInstitution.id },
      data: { isActive: false },
    });
  }
}
