import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Guard que permite acesso para SUPER_ADMIN, INSTITUTION_ADMIN, COORDINATOR e TEACHER
 */
@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTION_ADMIN,
      UserRole.COORDINATOR,
      UserRole.TEACHER,
    ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso restrito a Professores e Gestores');
    }

    return true;
  }
}
