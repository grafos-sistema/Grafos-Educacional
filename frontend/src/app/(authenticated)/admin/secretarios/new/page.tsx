'use client';

import { NewUserPageContent } from '@/app/(authenticated)/admin/users/new/page';
import { UserRole } from '@/types/user.types';

export default function NewSecretarioPage() {
  return (
    <NewUserPageContent
      fixedRole={UserRole.INSTITUTION_ADMIN}
      lockRole
      backRoute="/admin/secretarios"
      successRoute="/admin/secretarios"
    />
  );
}
