'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rankingsService, RankingPeriod } from '@/services/rankings.service';
import { useAuthStore } from '@/stores/authStore';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  TrophyIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const periodLabels: Record<RankingPeriod, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
  ALL_TIME: 'Todos os Tempos',
};

const periodOptions = Object.entries(periodLabels).map(([value, label]) => ({
  value,
  label,
}));

export default function CoordinatorRankingsPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<RankingPeriod>(RankingPeriod.MONTHLY);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Buscar ranking da instituicao
  const { data: institutionRanking, isLoading } = useQuery({
    queryKey: ['institution-ranking', user?.institutionId, period],
    queryFn: () => {
      if (!user?.institutionId) return [];
      return rankingsService.getInstitutionRanking(user.institutionId, period, 200);
    },
    enabled: !!user?.institutionId,
  });

  // Agrupar por turma
  const rankingsByClass = institutionRanking?.reduce((acc, ranking) => {
    if (!ranking.class) return acc;
    const classId = ranking.class.id;
    if (!acc[classId]) {
      acc[classId] = {
        class: ranking.class,
        students: [],
      };
    }
    acc[classId].students.push(ranking);
    return acc;
  }, {} as Record<string, { class: any; students: any[] }>);

  const classes = rankingsByClass ? Object.values(rankingsByClass) : [];

  // Ranking da turma selecionada
  const selectedClassRanking = selectedClassId
    ? rankingsByClass?.[selectedClassId]?.students.sort((a, b) => a.rank - b.rank) || []
    : [];

  // Estatisticas gerais
  const totalStudents = institutionRanking?.length || 0;
  const averagePoints =
    totalStudents > 0
      ? Math.round(
          institutionRanking!.reduce((sum, r) => sum + r.totalPoints, 0) / totalStudents
        )
      : 0;

  const topPerformers = institutionRanking?.filter((r) => r.rank <= 10) || [];

  // Calcular performance por turma
  const classPerformance = classes.map((classData) => {
    const students = classData.students;
    const avgPoints = Math.round(
      students.reduce((sum, s) => sum + s.totalPoints, 0) / students.length
    );
    const topStudent = students.sort((a, b) => a.rank - b.rank)[0];
    const studentsImproving = students.filter(
      (s) => s.previousRank && s.previousRank > s.rank
    ).length;

    return {
      ...classData,
      avgPoints,
      topStudent,
      studentsImproving,
      improvementRate: Math.round((studentsImproving / students.length) * 100),
    };
  });

  // Ordenar turmas por media de pontos
  const sortedClassPerformance = classPerformance.sort((a, b) => b.avgPoints - a.avgPoints);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rankings e Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitore o desempenho geral dos alunos
          </p>
        </div>
        <div className="w-48">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as RankingPeriod)}
            options={periodOptions}
          />
        </div>
      </div>

      {/* Estatisticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalStudents}
              </p>
            </div>
            <UsersIcon className="h-12 w-12 text-primary-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Turmas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {classes.length}
              </p>
            </div>
            <AcademicCapIcon className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Media de Pontos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {averagePoints}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top 10</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {topPerformers.length}
              </p>
            </div>
            <TrophyIcon className="h-12 w-12 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Performance por Turma */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance por Turma
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Clique em uma turma para ver o ranking detalhado
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : sortedClassPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedClassPerformance.map((classData, index) => (
                <div
                  key={classData.class.id}
                  className="p-5 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border-2 border-transparent hover:border-primary-500"
                  onClick={() => setSelectedClassId(classData.class.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <TrophyIcon className="h-5 w-5 text-yellow-500" />
                      )}
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {classData.class.name}
                      </h4>
                    </div>
                    <Badge
                      variant={index === 0 ? 'success' : index === 1 ? 'info' : 'default'}
                      size="sm"
                    >
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Alunos:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {classData.students.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Media:
                      </span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {classData.avgPoints} pts
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Melhorando:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                        {classData.improvementRate}%
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Destaque:</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {classData.topStudent?.user.firstName}{' '}
                        {classData.topStudent?.user.lastName}
                      </p>
                      <p className="text-xs text-primary-600 dark:text-primary-400">
                        {classData.topStudent?.totalPoints} pontos
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado de ranking disponivel
            </div>
          )}
        </div>
      </div>

      {/* Ranking Detalhado da Turma Selecionada */}
      {selectedClassId && selectedClassRanking.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              {rankingsByClass?.[selectedClassId]?.class.name} - Ranking Completo
            </h3>
            <button
              onClick={() => setSelectedClassId('')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Pos.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Aluno
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Freq.
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ativ.
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Sim.
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Streak
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Var.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedClassRanking.map((ranking, index) => (
                    <tr
                      key={ranking.id}
                      className={
                        index < 3
                          ? 'bg-primary-50 dark:bg-primary-900/10'
                          : 'bg-white dark:bg-gray-800'
                      }
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-400 text-yellow-900'
                              : index === 1
                              ? 'bg-gray-300 text-gray-700'
                              : index === 2
                              ? 'bg-orange-400 text-orange-900'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ranking.user.firstName} {ranking.user.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {ranking.gradePoints}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {ranking.attendancePoints}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {ranking.activityPoints}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {ranking.examPoints}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-orange-600 dark:text-orange-400">
                        {ranking.streakBonus > 0 ? `+${ranking.streakBonus}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          {ranking.totalPoints}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ranking.previousRank && ranking.previousRank !== ranking.rank ? (
                          ranking.previousRank > ranking.rank ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center justify-center gap-1 text-sm font-medium">
                              <ArrowTrendingUpIcon className="h-4 w-4" />
                              {ranking.previousRank - ranking.rank}
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 flex items-center justify-center gap-1 text-sm font-medium">
                              <ArrowTrendingDownIcon className="h-4 w-4" />
                              {ranking.rank - ranking.previousRank}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Geral da Instituicao */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            Top 10 da Instituicao
          </h3>
        </div>
        <div className="p-6">
          {topPerformers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topPerformers.map((ranking, index) => (
                <div
                  key={ranking.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                      index === 0
                        ? 'bg-yellow-400 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                        ? 'bg-orange-400 text-orange-900'
                        : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {ranking.user.firstName} {ranking.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ranking.class?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {ranking.totalPoints}
                    </p>
                    <p className="text-xs text-gray-500">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponivel
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
