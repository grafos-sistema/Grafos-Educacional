'use client';

import { useParams } from 'next/navigation';
import { EditUserPageContent } from '@/components/users/EditUserPageContent';

export default function EditTeacherPage() {
  const params = useParams();
  const userId = params?.id as string;

  return (
    <EditUserPageContent
      userId={userId}
      backRoute="/admin/professores"
      successRoute="/admin/professores"
    />
  );
}
