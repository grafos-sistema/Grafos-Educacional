'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rankingsService, RankingPeriod } from '@/services/rankings.service';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { teachersService } from '@/services/teachers.service';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { TrophyIcon, ChartBarIcon, AcademicCapIcon, UsersIcon } from '@heroicons/react/24/outline';

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

export default function TeacherRankingsPage() {
  const [period, setPeriod] = useState<RankingPeriod>(RankingPeriod.MONTHLY);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: profile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: fetchCurrentUserProfile,
  });

  const teacherId = profile?.teacherProfile?.id;

  const { data: teacherAssignments = [], isLoading: loadingTeacherClasses } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: () => teachersService.getTeacherClasses(teacherId!),
    enabled: !!teacherId,
  });

  const classes = Array.from(
    new Map(teacherAssignments.map((item) => [item.class.id, item.class])).values(),
  );

  const { data: rankingsByClass = {}, isLoading: loadingRankings } = useQuery({
    queryKey: ['teacher-class-rankings', period, classes.map((item) => item.id).sort().join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        classes.map(async (classItem) => [
          classItem.id,
          await rankingsService.getClassRanking(classItem.id, period, 100),
        ] as const),
      );

      return Object.fromEntries(entries);
    },
    enabled: classes.length > 0,
  });

  // Ranking da turma selecionada
  const selectedClassRanking = selectedClassId
    ? [...(rankingsByClass[selectedClassId] ?? [])].sort((a, b) => a.rank - b.rank)
    : [];

  // Estatísticas gerais
  const allRankings = Object.values(rankingsByClass).flat();
  const totalStudents = new Set(allRankings.map((ranking) => ranking.user.id)).size;
  const averagePoints =
    totalStudents > 0
      ? Math.round(
          allRankings.reduce((sum, ranking) => sum + ranking.totalPoints, 0) / totalStudents
        )
      : 0;
  const topStudents = [...allRankings]
    .sort((a, b) => b.totalPoints - a.totalPoints || a.rank - b.rank)
    .slice(0, 10);
  const isLoading = loadingTeacherClasses || loadingRankings;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rankings das Turmas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o desempenho dos seus alunos
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

      {/* Estatísticas Gerais */}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Média de Pontos</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Top Alunos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {topStudents.length}
              </p>
            </div>
            <TrophyIcon className="h-12 w-12 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Comparativo de Turmas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comparativo de Turmas
          </h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : classes.length > 0 ? (
            <div className="space-y-4">
              {classes.map((classData) => {
                const students = [...(rankingsByClass[classData.id] ?? [])].sort((a, b) => a.rank - b.rank);
                if (students.length === 0) {
                  return null;
                }

                const avgPoints = Math.round(
                  students.reduce((sum, student) => sum + student.totalPoints, 0) / students.length
                );
                const topStudent = students[0];

                return (
                  <div
                    key={classData.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedClassId(classData.id)}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {classData.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {students.length} alunos • Média: {avgPoints} pontos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Destaque:</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {topStudent?.user.firstName} {topStudent?.user.lastName}
                      </p>
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        {topStudent?.totalPoints} pontos
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma turma com dados de ranking
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
              {classes.find((classItem) => classItem.id === selectedClassId)?.name} - Ranking Detalhado
            </h3>
            <button
              onClick={() => setSelectedClassId('')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Fechar
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {selectedClassRanking.slice(0, 20).map((ranking, index) => (
                  <div
                    key={ranking.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
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
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ranking.user.firstName} {ranking.user.lastName}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span>Notas: {ranking.gradePoints}pts</span>
                        <span>Freq: {ranking.attendancePoints}pts</span>
                        <span>Ativ: {ranking.activityPoints}pts</span>
                        {ranking.streakBonus > 0 && (
                          <span className="text-orange-600">
                            Streak: +{ranking.streakBonus}pts
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {ranking.totalPoints}
                      </p>
                      <p className="text-xs text-gray-500">pontos</p>
                    </div>
                    {ranking.previousRank && ranking.previousRank !== ranking.rank && (
                      <div className="text-sm">
                        {ranking.previousRank > ranking.rank ? (
                          <span className="text-green-600">
                            ↑ {ranking.previousRank - ranking.rank}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            ↓ {ranking.rank - ranking.previousRank}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            Destaques das Minhas Turmas
          </h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : topStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topStudents.map((ranking, index) => (
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
