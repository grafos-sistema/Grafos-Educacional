'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useTeacherClassSubjects } from '@/hooks/useTeacherClassSubjects';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatScheduleLoad } from '@/lib/schedule-load';

export default function ProfessorClassDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { data: teacherSubjects = [], isLoading } = useTeacherClassSubjects();

  const assignments = teacherSubjects.filter((assignment) => assignment.classId === classId);
  const classData = assignments[0]?.class;

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando detalhes da turma..." />
      </div>
    );
  }

  if (!classData || assignments.length === 0) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-6"
        >
          Voltar para Minhas Turmas
        </Button>
        <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
          <UserGroupIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h1 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Turma não encontrada
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Esta turma não está vinculada às disciplinas do seu perfil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {classData.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Consulte as disciplinas e acesse os lançamentos desta turma.
            </p>
          </div>
          <Badge variant={classData.isActive ? 'success' : 'error'}>
            {classData.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <AcademicCapIcon className="mb-3 h-5 w-5 text-blue-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Curso</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {classData.course?.name || 'Não informado'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <CalendarDaysIcon className="mb-3 h-5 w-5 text-emerald-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Ano letivo</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {classData.academicYear?.year || 'Não informado'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <UserGroupIcon className="mb-3 h-5 w-5 text-violet-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Alunos</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {classData._count?.enrollments ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <ClockIcon className="mb-3 h-5 w-5 text-amber-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Turno</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {classData.shift || 'Não informado'}
          </p>
        </div>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-5 flex items-center gap-3">
          <BookOpenIcon className="h-6 w-6 text-primary-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Minhas disciplinas nesta turma
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acesse rapidamente a frequência ou as notas de cada disciplina.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.classSubjectId ?? assignment.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-lg p-2"
                  style={{
                    backgroundColor: assignment.subject?.color
                      ? `${assignment.subject.color}20`
                      : '#E5E7EB',
                  }}
                >
                  <BookOpenIcon
                    className="h-5 w-5"
                    style={{ color: assignment.subject?.color || '#6B7280' }}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {assignment.subject?.name || 'Disciplina'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {assignment.subject?.code ? `Código: ${assignment.subject.code}` : 'Disciplina atribuída'}
                    {` • ${formatScheduleLoad(assignment.scheduledMinutes, assignment.scheduledClassCount)}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/professor/attendance?classSubjectId=${assignment.id}`)}
                >
                  Frequência
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(`/professor/grades?classSubjectId=${assignment.id}`)}
                >
                  Notas
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
