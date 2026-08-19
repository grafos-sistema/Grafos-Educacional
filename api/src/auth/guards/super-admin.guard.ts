import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Guard que permite acesso apenas para administradores globais
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowedRoles = [UserRole.SUPER_ADMIN_GLOBAL];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso restrito a administradores globais');
    }

    return true;
  }
}
