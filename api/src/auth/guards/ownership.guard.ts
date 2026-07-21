import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SKIP_OWNERSHIP_KEY = 'skipOwnership';

/**
 * Guard que verifica se o usuário está acessando apenas seus próprios dados
 * Compara o userId do token JWT com o ID do recurso sendo acessado
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica se deve pular a verificação de ownership
    const skipOwnership = this.reflector.getAllAndOverride<boolean>(SKIP_OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Obtém o ID do recurso dos parâmetros da rota
    const resourceId = request.params.id || request.params.userId;

    // Se não houver ID no parâmetro, permite (será validado em outro lugar)
    if (!resourceId) {
      return true;
    }

    // SUPER_ADMIN e INSTITUTION_ADMIN podem acessar qualquer recurso
    if (user.role === 'SUPER_ADMIN' || user.role === 'INSTITUTION_ADMIN') {
      return true;
    }

    // Verifica se o usuário está acessando seu próprio recurso
    if (resourceId !== user.userId) {
      throw new ForbiddenException('Você só pode acessar seus próprios dados');
    }

    return true;
  }
}
