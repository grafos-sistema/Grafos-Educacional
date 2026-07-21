import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId: string;
  firstName: string;
  lastName: string;
}

/**
 * Decorator para obter o usuário autenticado da requisição
 * @example getCurrentUser(@CurrentUser() user: CurrentUserPayload)
 * @example getUserId(@CurrentUser('userId') userId: string)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    return data ? user?.[data] : user;
  },
);
