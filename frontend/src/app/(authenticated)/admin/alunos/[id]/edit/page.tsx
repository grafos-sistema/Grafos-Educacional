'use client';

import { useParams } from 'next/navigation';
import { EditUserPageContent } from '../../../users/[id]/edit/page';

export default function EditStudentPage() {
  const params = useParams();
  const userId = params?.id as string;

  return (
    <EditUserPageContent
      userId={userId}
      backRoute="/admin/alunos"
      successRoute="/admin/alunos"
    />
  );
}
