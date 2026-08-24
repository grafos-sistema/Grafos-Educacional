'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  UsersIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ClassSubjectsManager } from '@/components/classes/ClassSubjectsManager';
import { ClassStudentsManager } from '@/components/classes/ClassStudentsManager';

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => classesService.findOne(classId),
    enabled: Boolean(classId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando turma..." />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Turma não encontrada.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            className="mb-4"
          >
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {classData.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulte a estrutura pedagógica da turma, a sala e os vínculos de disciplina com
            seus respectivos professores.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/admin/classes/${classId}/edit`)}
          leftIcon={<PencilIcon className="h-5 w-5" />}
        >
          Editar Turma
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <AcademicCapIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Curso</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {classData.course?.name || 'Não informado'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {classData.grade}
            {classData.section ? ` • Turma ${classData.section}` : ''}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDaysIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ano Letivo
            </span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {classData.academicYear?.year ? String(classData.academicYear.year) : 'Não informado'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {classData.shift || 'Turno não definido'}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <UsersIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sala
            </span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {classData.baseRoom || 'Não definida'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {classData.baseRoom
              ? 'Usada como local padrão nos horários da turma.'
              : 'Defina a sala na edição para evitar repetir local em cada aula.'}
          </p>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <UsersIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Alunos</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {classData._count?.enrollments ?? 0}
            {classData.maxStudents ? ` / ${classData.maxStudents}` : ''}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {classData.isActive ? 'Turma ativa' : 'Turma inativa'}
          </p>
        </div>
      </div>

      <ClassSubjectsManager
        classId={classId}
        institutionId={classData.institutionId}
        readOnly
        description="Consulte as disciplinas que pertencem a esta turma e os respectivos professores. Para alterar os vínculos, abra a edição da turma."
      />

      <ClassStudentsManager
        classId={classId}
        institutionId={classData.institutionId}
        maxStudents={classData.maxStudents}
        readOnly
      />
    </div>
  );
}
