'use client';

import { NewUserPageContent } from '../../users/new/page';
import { UserRole } from '@/types/user.types';

export default function NewCoordinatorPage() {
  return (
    <NewUserPageContent
      fixedRole={UserRole.COORDINATOR}
      lockRole
      backRoute="/admin/coordenadores"
      successRoute="/admin/coordenadores"
    />
  );
}
