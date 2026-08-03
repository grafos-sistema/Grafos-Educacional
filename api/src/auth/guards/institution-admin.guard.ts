import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

/**
 * Guard que permite acesso para perfis administrativos.
 * Quando a rota também usa @Roles(...), respeita as roles declaradas nela.
 */
@Injectable()
export class InstitutionAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const administrativeRoles = [
      UserRole.SUPER_ADMIN_GLOBAL,
      UserRole.SUPER_ADMIN,
      UserRole.DIRECTOR,
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
    ];
    const routeRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const allowedRoles =
      routeRoles.length > 0
        ? administrativeRoles.filter((role) => routeRoles.includes(role))
        : [
            UserRole.SUPER_ADMIN_GLOBAL,
            UserRole.SUPER_ADMIN,
            UserRole.DIRECTOR,
            UserRole.INSTITUTION_ADMIN,
          ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
          'Acesso restrito a administradores da instituição',
      );
    }

    return true;
  }
}
