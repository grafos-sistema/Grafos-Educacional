import { SetMetadata } from '@nestjs/common';
import { SKIP_INSTITUTION_CHECK_KEY } from '../../auth/guards/institution.guard';

/**
 * Decorator para pular a verificação de instituição (multi-tenant)
 * Útil para SUPER_ADMIN que pode acessar dados de todas as instituições
 * @example @SkipInstitutionCheck()
 */
export const SkipInstitutionCheck = () =>
  SetMetadata(SKIP_INSTITUTION_CHECK_KEY, true);
