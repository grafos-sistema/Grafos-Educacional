'use client';

import { NewUserPageContent } from '../../users/new/page';
import { UserRole } from '@/types/user.types';

export default function NewTeacherPage() {
  return (
    <NewUserPageContent
      fixedRole={UserRole.TEACHER}
      lockRole
      backRoute="/admin/professores"
      successRoute="/admin/professores"
    />
  );
}
