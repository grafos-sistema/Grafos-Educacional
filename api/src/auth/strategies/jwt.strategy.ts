import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  institutionId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly localJwtSecret: string;
  private readonly supabaseUrl?: string;
  private readonly supabaseIssuer?: string;
  private readonly supabaseJwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const localJwtSecret =
      configService.get<string>('jwt.secret') || 'default-secret';
    const supabaseUrl = configService.get<string>('jwt.supabaseUrl')?.trim();
    const normalizedSupabaseUrl = supabaseUrl?.replace(/\/+$/, '');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: localJwtSecret,
      passReqToCallback: true,
    });

    this.localJwtSecret = localJwtSecret;
    this.supabaseUrl = normalizedSupabaseUrl;
    this.supabaseIssuer = normalizedSupabaseUrl
      ? `${normalizedSupabaseUrl}/auth/v1`
      : undefined;
    this.supabaseJwks = this.supabaseIssuer
      ? createRemoteJWKSet(
          new URL(`${this.supabaseIssuer}/.well-known/jwks.json`),
        )
      : undefined;
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);

    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }

    const verifiedPayload = await this.resolvePayload(token, payload);
    return this.resolveUser(verifiedPayload);
  }

  private async resolvePayload(
    token: string,
    fallbackPayload: JwtPayload,
  ): Promise<JwtPayload> {
    if (this.supabaseIssuer && this.supabaseJwks) {
      try {
        const { payload } = await jwtVerify(token, this.supabaseJwks, {
          issuer: this.supabaseIssuer,
        });

        return payload as JwtPayload;
      } catch (error) {
        // Fallback para o JWT local legado da API.
      }
    }

    return fallbackPayload;
  }

  private async resolveUser(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido: subject ausente');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: payload.sub }, { authUserId: payload.sub }],
      },
      select: {
        id: true,
        authUserId: true,
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

    return {
      userId: user.id,
      authUserId: user.authUserId,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      firstName: user.firstName,
      lastName: user.lastName,
      teacherId: user.teacherProfile?.id,
      studentId: user.studentProfile?.id,
      parentId: user.parentProfile?.id,
      jwtSubject: payload.sub,
    };
  }
}
