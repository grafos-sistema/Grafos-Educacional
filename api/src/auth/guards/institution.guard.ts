import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SKIP_INSTITUTION_CHECK_KEY = 'skipInstitutionCheck';

/**
 * Guard que garante isolamento multi-tenant
 * Verifica se o usuário só acessa recursos da sua própria instituição
 */
@Injectable()
export class InstitutionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica se deve pular a verificação de instituição
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_INSTITUTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // SUPER_ADMIN pode acessar qualquer instituição
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Verifica se há institutionId no body, params ou query
    const resourceInstitutionId =
      request.body?.institutionId ||
      request.params?.institutionId ||
      request.query?.institutionId;

    // Se não houver institutionId no request, permite (será validado em outro lugar)
    if (!resourceInstitutionId) {
      return true;
    }

    // Verifica se o usuário está acessando recursos da sua própria instituição
    if (resourceInstitutionId !== user.institutionId) {
      throw new ForbiddenException(
        'Você só pode acessar recursos da sua própria instituição',
      );
    }

    return true;
  }
}
