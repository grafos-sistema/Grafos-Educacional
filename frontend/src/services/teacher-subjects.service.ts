import { supabase } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
  subject: {
    id: string;
    name: string;
    code?: string;
    color?: string;
    description?: string;
  };
}

type DbTeacherSubject = {
  id: string;
  teacherId: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
    description: string | null;
  } | null;
};

function mapTeacherSubject(row: DbTeacherSubject): TeacherSubject {
  return {
    id: row.id,
    teacherId: row.teacherId,
    subjectId: row.subjectId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    subject: {
      id: row.subject?.id ?? row.subjectId,
      name: row.subject?.name ?? '',
      code: row.subject?.code ?? undefined,
      color: row.subject?.color ?? undefined,
      description: row.subject?.description ?? undefined,
    },
  };
}

export const teacherSubjectsService = {
  // Listar minhas disciplinas configuradas
  getMySubjects: async (): Promise<TeacherSubject[]> => {
    const profile = await fetchCurrentUserProfile();
    const teacherId = profile.teacherProfile?.id;

    if (!teacherId) {
      return [];
    }

    const { data, error } = await supabase
      .from('teacher_subjects')
      .select('id, teacherId, subjectId, createdAt, updatedAt, subject:subjects(id, name, code, color, description)')
      .eq('teacherId', teacherId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbTeacherSubject[]).map(mapTeacherSubject);
  },

  // Adicionar disciplina às minhas disciplinas
  addMySubject: async (subjectId: string): Promise<TeacherSubject> => {
    const result = await teacherSubjectsService.addMySubjectsBulk([subjectId]);

    if (result.created < 1) {
      const list = await teacherSubjectsService.getMySubjects();
      const existing = list.find((item) => item.subjectId === subjectId);
      if (!existing) {
        throw new Error('Não foi possível adicionar a disciplina');
      }
      return existing;
    }

    const list = await teacherSubjectsService.getMySubjects();
    const created = list.find((item) => item.subjectId === subjectId);
    if (!created) {
      throw new Error('Não foi possível adicionar a disciplina');
    }
    return created;
  },

  // Adicionar múltiplas disciplinas
  addMySubjectsBulk: async (subjectIds: string[]): Promise<{ created: number; message: string }> => {
    const profile = await fetchCurrentUserProfile();
    const teacherId = profile.teacherProfile?.id;

    if (!teacherId) {
      throw new Error('Perfil de professor não encontrado');
    }

    const uniqueIds = Array.from(new Set(subjectIds)).filter(Boolean);
    if (uniqueIds.length === 0) {
      return { created: 0, message: 'Nenhuma disciplina informada' };
    }

    const { data: existing, error: existingError } = await supabase
      .from('teacher_subjects')
      .select('subjectId')
      .eq('teacherId', teacherId)
      .in('subjectId', uniqueIds);

    if (existingError) throw existingError;

    const existingSet = new Set((existing ?? []).map((row: any) => row.subjectId as string));
    const toCreate = uniqueIds.filter((id) => !existingSet.has(id));

    if (toCreate.length === 0) {
      return { created: 0, message: 'Todas as disciplinas já estavam adicionadas' };
    }

    const now = new Date().toISOString();
    const payload = toCreate.map((id) => ({
      id: crypto.randomUUID(),
      teacherId,
      subjectId: id,
      createdAt: now,
      updatedAt: now,
    }));

    const { error: insertError } = await supabase.from('teacher_subjects').insert(payload);
    if (insertError) throw insertError;

    return { created: toCreate.length, message: 'Disciplinas adicionadas com sucesso' };
  },

  // Sincronizar disciplinas (substitui todas)
  syncMySubjects: async (subjectIds: string[]): Promise<TeacherSubject[]> => {
    const profile = await fetchCurrentUserProfile();
    const teacherId = profile.teacherProfile?.id;

    if (!teacherId) {
      throw new Error('Perfil de professor não encontrado');
    }

    const uniqueIds = Array.from(new Set(subjectIds)).filter(Boolean);

    const { error: deleteError } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacherId', teacherId);

    if (deleteError) throw deleteError;

    if (uniqueIds.length > 0) {
      const now = new Date().toISOString();
      const payload = uniqueIds.map((id) => ({
        id: crypto.randomUUID(),
        teacherId,
        subjectId: id,
        createdAt: now,
        updatedAt: now,
      }));

      const { error: insertError } = await supabase
        .from('teacher_subjects')
        .insert(payload);

      if (insertError) throw insertError;
    }

    return teacherSubjectsService.getMySubjects();
  },

  // Remover disciplina das minhas disciplinas
  removeMySubject: async (subjectId: string): Promise<void> => {
    const profile = await fetchCurrentUserProfile();
    const teacherId = profile.teacherProfile?.id;

    if (!teacherId) {
      throw new Error('Perfil de professor não encontrado');
    }

    const { error } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacherId', teacherId)
      .eq('subjectId', subjectId);

    if (error) throw error;
  },

  // Admin: Listar disciplinas de um professor
  getByTeacher: async (teacherId: string): Promise<TeacherSubject[]> => {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .select('id, teacherId, subjectId, createdAt, updatedAt, subject:subjects(id, name, code, color, description)')
      .eq('teacherId', teacherId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbTeacherSubject[]).map(mapTeacherSubject);
  },

  // Admin: Sincronizar disciplinas de um professor
  syncTeacherSubjects: async (teacherId: string, subjectIds: string[]): Promise<TeacherSubject[]> => {
    const uniqueIds = Array.from(new Set(subjectIds)).filter(Boolean);

    const { error: deleteError } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacherId', teacherId);

    if (deleteError) throw deleteError;

    if (uniqueIds.length > 0) {
      const now = new Date().toISOString();
      const payload = uniqueIds.map((id) => ({
        id: crypto.randomUUID(),
        teacherId,
        subjectId: id,
        createdAt: now,
        updatedAt: now,
      }));

      const { error: insertError } = await supabase
        .from('teacher_subjects')
        .insert(payload);

      if (insertError) throw insertError;
    }

    return teacherSubjectsService.getByTeacher(teacherId);
  },
};
