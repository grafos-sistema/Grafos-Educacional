import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Guard que permite acesso apenas para PARENT
 * (além de admins que sempre têm acesso)
 */
@Injectable()
export class ParentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTION_ADMIN,
      UserRole.PARENT,
    ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso restrito a Pais/Responsáveis');
    }

    return true;
  }
}
