import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Guard que permite acesso apenas para SUPER_ADMIN
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Acesso restrito a Super Administradores');
    }

    return true;
  }
}
