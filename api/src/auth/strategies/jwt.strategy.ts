import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  institutionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Busca o usuário no banco para garantir que ainda existe e está ativo
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        institutionId: true,
        isActive: true,
        firstName: true,
        lastName: true,
        teacherProfile: {
          select: {
            id: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
          },
        },
        parentProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Retorna o usuário que será adicionado ao request.user
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      firstName: user.firstName,
      lastName: user.lastName,
      teacherId: user.teacherProfile?.id,
      studentId: user.studentProfile?.id,
      parentId: user.parentProfile?.id,
    };
  }
}
