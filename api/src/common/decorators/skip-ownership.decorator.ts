import { SetMetadata } from '@nestjs/common';
import { SKIP_OWNERSHIP_KEY } from '../../auth/guards/ownership.guard';

/**
 * Decorator para pular a verificação de ownership
 * Útil para endpoints onde administradores podem acessar dados de outros usuários
 * @example @SkipOwnership()
 */
export const SkipOwnership = () => SetMetadata(SKIP_OWNERSHIP_KEY, true);
