'use client';

import { useQuery } from '@tanstack/react-query';
import { teachersService } from '@/services/teachers.service';
import { useAuthStore } from '@/stores/authStore';

export function useTeacherClassSubjects() {
  const teacherId = useAuthStore((state) => state.user?.teacherProfile?.id);

  return useQuery({
    queryKey: ['teacher-class-subjects', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];

      const assignments = await teachersService.getTeacherClasses(teacherId);
      return assignments.filter(
        (assignment) =>
          assignment.assignmentType !== 'main_teacher' &&
          Boolean(assignment.subjectId) &&
          Boolean(assignment.subject?.id)
      );
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
