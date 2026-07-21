'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { gradesService } from '@/services/grades.service';
import { academicPeriodsService } from '@/services/academic-periods.service';
import { GradeStatus } from '@/types/grade.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

export default function StudentGradesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Buscar matrículas do aluno
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['student-enrollments-grades', user?.id],
    queryFn: async () => {
      const response = await classesService.findAll({
        institutionId: user?.institutionId,
        limit: 100,
      });

      const allEnrollments = await Promise.all(
        response.data.map(async (classItem) => {
          try {
            const enrollments = await classesService.getEnrollments(classItem.id);
            return enrollments
              .filter((e) => e.studentId === user?.id)
              .map((e) => ({
                ...e,
                class: classItem,
              }));
          } catch {
            return [];
          }
        })
      );

      return allEnrollments.flat();
    },
    enabled: !!user?.id && user?.role === UserRole.STUDENT,
  });

  // Buscar disciplinas das turmas matriculadas
  const { data: classSubjects } = useQuery({
    queryKey: ['student-class-subjects-grades', enrollments],
    queryFn: async () => {
      if (!enrollments || enrollments.length === 0) return [];

      const allSubjects = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const subjects = await classesService.getClassSubjects(enrollment.class.id);
            return subjects.map((s) => ({
              ...s,
              class: enrollment.class,
            }));
          } catch {
            return [];
          }
        })
      );

      return allSubjects.flat();
    },
    enabled: !!enrollments && enrollments.length > 0,
  });

  // Buscar períodos acadêmicos
  const { data: periods } = useQuery({
    queryKey: ['academic-periods-student', user?.institutionId],
    queryFn: async () => {
      const response = await academicPeriodsService.findAll({
        limit: 100,
      });
      return response.data;
    },
    enabled: !!user?.institutionId,
  });

  // Buscar notas do aluno
  const { data: grades, isLoading: loadingGrades } = useQuery({
    queryKey: ['student-grades', user?.studentProfile?.id, selectedPeriodId, selectedSubjectId],
    queryFn: async () => {
      if (!user?.studentProfile?.id) return [];

      const filters: any = { studentId: user.studentProfile.id, limit: 1000 };
      if (selectedPeriodId !== 'all') filters.academicPeriodId = selectedPeriodId;
      if (selectedSubjectId !== 'all') filters.classSubjectId = selectedSubjectId;

      return await gradesService.getStudentGrades(user.studentProfile.id, filters);
    },
    enabled: !!user?.studentProfile?.id,
  });

  // Agrupar notas por disciplina e período
  const groupedGrades = grades?.reduce((acc, grade) => {
    const subjectId = grade.classSubjectId;
    const periodId = grade.academicPeriodId;
    const key = `${subjectId}-${periodId}`;

    if (!acc[key]) {
      acc[key] = {
        subject: grade.classSubject?.subject,
        period: grade.academicPeriod,
        grades: [],
        average: 0,
        totalWeight: 0,
      };
    }

    acc[key].grades.push(grade);
    return acc;
  }, {} as Record<string, any>);

  // Calcular médias
  Object.keys(groupedGrades || {}).forEach((key) => {
    const group = groupedGrades![key];
    const publishedGrades = group.grades.filter(
      (g: any) => g.status === GradeStatus.PUBLISHED || g.status === GradeStatus.FINAL
    );

    if (publishedGrades.length > 0) {
      const totalWeightedValue = publishedGrades.reduce(
        (sum: number, g: any) => sum + g.value * g.weight,
        0
      );
      const totalWeight = publishedGrades.reduce((sum: number, g: any) => sum + g.weight, 0);
      group.average = totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
      group.totalWeight = totalWeight;
    }
  });

  const getStatusBadge = (status: GradeStatus) => {
    switch (status) {
      case GradeStatus.PUBLISHED:
        return <Badge variant="success">Publicada</Badge>;
      case GradeStatus.FINAL:
        return <Badge variant="info">Final</Badge>;
      case GradeStatus.PENDING:
        return <Badge variant="warning">Pendente</Badge>;
      default:
        return null;
    }
  };

  const getAverageColor = (average: number) => {
    if (average >= 7) return 'text-green-600 dark:text-green-400';
    if (average >= 6) return 'text-blue-600 dark:text-blue-400';
    if (average >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAverageStatus = (average: number) => {
    if (average >= 6) return 'Aprovado';
    if (average >= 4) return 'Recuperação';
    return 'Reprovado';
  };

  const globalAverage =
    groupedGrades && Object.keys(groupedGrades).length > 0
      ? Object.values(groupedGrades).reduce((sum, g) => sum + g.average, 0) /
        Object.keys(groupedGrades).length
      : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/aluno/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Minhas Notas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe seu desempenho acadêmico
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Período Acadêmico"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            options={[
              { value: 'all', label: 'Todos os Períodos' },
              ...(periods?.map((period) => ({
                value: period.id,
                label: period.name,
              })) || []),
            ]}
          />

          <Select
            label="Disciplina"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            options={[
              { value: 'all', label: 'Todas as Disciplinas' },
              ...(classSubjects?.map((cs) => ({
                value: cs.id,
                label: cs.subject?.name || '',
              })) || []),
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Média Geral</div>
          </div>
          <div className={`text-3xl font-bold ${getAverageColor(globalAverage)}`}>
            {globalAverage.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getAverageStatus(globalAverage)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Disciplinas</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {classSubjects?.length || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avaliações</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {grades?.filter((g) => g.status !== GradeStatus.PENDING).length || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Publicadas</div>
        </div>
      </div>

      {/* Grades List */}
      {loadingGrades || loadingEnrollments ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando notas..." />
        </div>
      ) : groupedGrades && Object.keys(groupedGrades).length > 0 ? (
        <div className="space-y-6">
          {Object.values(groupedGrades).map((group: any) => (
            <div
              key={`${group.subject.id}-${group.period.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Subject Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: group.subject?.color
                          ? `${group.subject.color}20`
                          : '#E5E7EB',
                      }}
                    >
                      <AcademicCapIcon
                        className="h-6 w-6"
                        style={{ color: group.subject?.color || '#6B7280' }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {group.subject?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {group.period?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Média</div>
                    <div className={`text-3xl font-bold ${getAverageColor(group.average)}`}>
                      {group.average.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grades Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avaliação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nota
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Peso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.grades.map((grade: any) => (
                      <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {grade.examType}
                            </div>
                            {grade.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {grade.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {grade.examDate
                            ? new Date(grade.examDate).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {grade.status === GradeStatus.PENDING ? (
                            <div className="flex items-center gap-2 text-gray-400">
                              <EyeSlashIcon className="h-5 w-5" />
                              <span>-</span>
                            </div>
                          ) : (
                            <div className={`text-2xl font-bold ${getAverageColor(grade.value)}`}>
                              {grade.value.toFixed(1)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {grade.weight.toFixed(1)}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(grade.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Observations */}
              {group.grades.some((g: any) => g.observations) && (
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Observações do Professor
                  </h4>
                  <div className="space-y-2">
                    {group.grades
                      .filter((g: any) => g.observations)
                      .map((grade: any) => (
                        <div key={grade.id} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{grade.examType}:</span> {grade.observations}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma nota disponível
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Suas notas aparecerão aqui quando forem publicadas pelos professores
          </p>
        </div>
      )}
    </div>
  );
}
