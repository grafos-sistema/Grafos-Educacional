import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export interface JwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  institutionId?: string;
}

@Injectable()
export class JwtStrategy {
  private readonly localJwtSecret: string;
  private readonly supabaseUrl?: string;
  private readonly supabaseIssuer?: string;
  private readonly supabaseJwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const localJwtSecret =
      configService.get<string>('jwt.secret') || 'default-secret';
    const supabaseUrl = configService.get<string>('jwt.supabaseUrl')?.trim();
    const normalizedSupabaseUrl = supabaseUrl?.replace(/\/+$/, '');

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

  async authenticateToken(token: string): Promise<CurrentUserPayload> {
    const verifiedPayload = await this.resolvePayload(token);
    return this.resolveUser(verifiedPayload);
  }

  private async resolvePayload(token: string): Promise<JwtPayload> {
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

    try {
      return (await this.jwtService.verifyAsync(token, {
        secret: this.localJwtSecret,
      })) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private async resolveUser(payload: JwtPayload): Promise<CurrentUserPayload> {
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
