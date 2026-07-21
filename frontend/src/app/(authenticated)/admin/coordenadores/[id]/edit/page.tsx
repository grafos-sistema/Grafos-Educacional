'use client';

import { useParams } from 'next/navigation';
import { EditUserPageContent } from '../../../users/[id]/edit/page';

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
