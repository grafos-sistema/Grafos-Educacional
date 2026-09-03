'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { teacherSubjectsService, TeacherSubject } from '@/services/teacher-subjects.service';

/**
 * Disciplinas atribuídas diretamente ao perfil do professor.
 *
 * Esta consulta é diferente da lista de turmas: uma disciplina pode estar
 * atribuída ao professor antes de ser distribuída para uma turma específica.
 */
export function useTeacherSubjects() {
  const teacherId = useAuthStore((state) => state.user?.teacherProfile?.id);

  return useQuery<TeacherSubject[]>({
    queryKey: ['my-subjects', teacherId],
    queryFn: () => teacherSubjectsService.getMySubjects(),
    enabled: Boolean(teacherId),
    staleTime: 60_000,
  });
}
