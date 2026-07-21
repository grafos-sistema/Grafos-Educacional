import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Guard que permite acesso para SUPER_ADMIN e INSTITUTION_ADMIN
 */
@Injectable()
export class InstitutionAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Acesso restrito a Administradores da Instituição',
      );
    }

    return true;
  }
}
