'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EditUserPageContent } from '../../../users/[id]/edit/page';

export default function EditStudentPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const [userId, setUserId] = useState<string | undefined>(rawId);

  useEffect(() => {
    let active = true;

    if (!rawId) {
      setUserId(undefined);
      return () => {
        active = false;
      };
    }

    (async () => {
      const { data } = await supabase
        .from('students')
        .select('userId')
        .eq('id', rawId)
        .maybeSingle();

      if (!active) return;
      setUserId(data?.userId || rawId);
    })();

    return () => {
      active = false;
    };
  }, [rawId]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando usuário..." />
      </div>
    );
  }

  return (
    <EditUserPageContent
      userId={userId}
      backRoute="/admin/alunos"
      successRoute="/admin/alunos"
    />
  );
}
