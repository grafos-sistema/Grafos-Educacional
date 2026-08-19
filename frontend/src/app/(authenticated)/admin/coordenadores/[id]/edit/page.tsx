'use client';

import { useParams } from 'next/navigation';
import { EditUserPageContent } from '@/components/users/EditUserPageContent';

export default function EditCoordinatorPage() {
  const params = useParams();
  const userId = params?.id as string;

  return (
    <EditUserPageContent
      userId={userId}
      backRoute="/admin/coordenadores"
      successRoute="/admin/coordenadores"
    />
  );
}
