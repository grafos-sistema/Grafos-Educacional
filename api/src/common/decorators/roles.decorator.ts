import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir quais roles podem acessar o endpoint
 * @param roles - Array de roles permitidos
 * @example @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
