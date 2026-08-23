'use client';

import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import { useTeacherClassSubjects } from '@/hooks/useTeacherClassSubjects';
import { formatScheduleLoad } from '@/lib/schedule-load';

export default function MyClassesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useTeacherClassSubjects();

  const classesWithSubjects = Object.values(
    teacherSubjects.reduce<Record<string, { class: (typeof teacherSubjects)[number]['class']; subjects: typeof teacherSubjects }>>(
      (acc, item) => {
        if (!acc[item.classId]) {
          acc[item.classId] = {
            class: item.class,
            subjects: [],
          };
        }

        if (!acc[item.classId].subjects.some((subject) => subject.subjectId === item.subjectId)) {
          acc[item.classId].subjects.push(item);
        }

        return acc;
      },
      {}
    )
  );

  // Filtrar por busca
  const filteredClasses = classesWithSubjects.filter((item: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.class.name.toLowerCase().includes(searchLower) ||
      item.class.grade.toLowerCase().includes(searchLower) ||
      item.subjects.some((s: any) => s.subject?.name.toLowerCase().includes(searchLower))
    );
  });

  // Calcular estatísticas
  const totalClasses = classesWithSubjects.length;
  const totalConfiguredSubjects = new Set(teacherSubjects.map((item) => item.subjectId)).size;
  const totalSubjectAssignments = classesWithSubjects.reduce(
    (acc: number, item: any) => acc + (item?.subjects?.length || 0),
    0
  );
  const totalScheduledMinutes = classesWithSubjects.reduce(
    (acc: number, item: any) =>
      acc + (item?.subjects?.reduce((sum: number, s: any) => sum + (s.scheduledMinutes || 0), 0) || 0),
    0,
  );
  const totalScheduledClasses = classesWithSubjects.reduce(
    (acc: number, item: any) =>
      acc + (item?.subjects?.reduce((sum: number, s: any) => sum + (s.scheduledClassCount || 0), 0) || 0),
    0,
  );

  const isLoading = loadingSubjects;
  const hasNoDistributedClasses = !loadingSubjects && teacherSubjects.length === 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/professor/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Minhas Turmas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Turmas em que suas disciplinas foram distribuídas pela Direção ou Coordenação
        </p>
      </div>

      {hasNoDistributedClasses && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Nenhuma turma distribuída para você ainda.</p>
          <p className="mt-1 text-amber-800">
            A Direção ou a Coordenação precisa vincular suas disciplinas às turmas para que elas apareçam aqui.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Disciplinas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalConfiguredSubjects}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Turmas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalClasses}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Aulas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSubjectAssignments}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Carga Horária</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatScheduleLoad(totalScheduledMinutes, totalScheduledClasses)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por turma ou disciplina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
          />
        </div>
      </div>

      {/* Lista de Turmas */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando turmas..." />
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="space-y-4">
          {filteredClasses.map((item: any, index: number) => (
            <div
              key={`${item.class?.id}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              {/* Cabeçalho da Turma */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.class.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.class.course?.name} • {item.class.grade}
                      {item.class.shift && ` • ${item.class.shift}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={item.class.isActive ? 'success' : 'error'}>
                    {item.class.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.class._count?.enrollments || 0} alunos
                  </span>
                </div>
              </div>

              {/* Disciplinas da Turma */}
              <div className="space-y-2">
                {(item.subjects || []).map((subject: any) => {
                  const isAssignedToMe = subject.teacherId === user?.teacherProfile?.id;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => router.push(`/professor/classes/${subject.classId}?subject=${subject.id}`)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: subject.subject?.color
                              ? `${subject.subject.color}20`
                              : '#E5E7EB',
                          }}
                        >
                          <BookOpenIcon
                            className="h-5 w-5"
                            style={{ color: subject.subject?.color || '#6B7280' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {subject.subject?.name}
                            </span>
                            {isAssignedToMe && (
                              <Badge variant="success" size="sm">
                                Atribuído a mim
                              </Badge>
                            )}
                          </div>
                          {subject.subject?.code && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Código: {subject.subject.code}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ClockIcon className="h-4 w-4" />
                        {formatScheduleLoad(subject.scheduledMinutes, subject.scheduledClassCount)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ações da Turma */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/professor/classes/${item.class.id}`)}
                >
                  Ver Detalhes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/professor/attendance?class=${item.class.id}`)}
                >
                  Lançar Frequência
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/professor/grades?class=${item.class.id}`)}
                >
                  Lançar Notas
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma turma disponível'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Não há turmas com as disciplinas que você leciona'}
          </p>
          {!searchTerm && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Verifique se as disciplinas estão configuradas corretamente
            </p>
          )}
        </div>
      )}
    </div>
  );
}
