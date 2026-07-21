'use client';

import { NewUserPageContent } from '../../users/new/page';
import { UserRole } from '@/types/user.types';

export default function NewStudentPage() {
  return (
    <NewUserPageContent
      fixedRole={UserRole.STUDENT}
      lockRole
      backRoute="/admin/alunos"
      successRoute="/admin/alunos"
    />
  );
}
