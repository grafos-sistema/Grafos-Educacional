'use client';

import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingsService, RankingPeriod } from '@/services/rankings.service';
import { achievementsService } from '@/services/achievements.service';
import { useAuthStore } from '@/stores/authStore';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrophyIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  SparklesIcon,
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

export default function AdminRankingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<RankingPeriod>(RankingPeriod.MONTHLY);
  const [view, setView] = useState<'general' | 'badges'>('general');
  const legacyAdminActionsAvailable = false;

  // Buscar ranking geral
  const { data: institutionRanking, isLoading } = useQuery({
    queryKey: ['institution-ranking', user?.institutionId, period],
    queryFn: () => {
      if (!user?.institutionId) return [];
      return rankingsService.getInstitutionRanking(user.institutionId, period, 100);
    },
    enabled: !!user?.institutionId,
  });

  // Buscar badges
  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => achievementsService.getAllBadges(),
  });

  // Recalcular rankings
  const recalculateMutation = useMutation({
    mutationFn: () => rankingsService.recalculateAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-ranking'] });
      toast.error('Rankings recalculados com sucesso!');
    },
  });

  // Seed badges
  const seedBadgesMutation = useMutation({
    mutationFn: () => achievementsService.seedBadges(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.error(`${data.created} badges criados com sucesso!`);
    },
  });

  // Estatísticas
  const totalStudents = institutionRanking?.length || 0;
  const averagePoints =
    totalStudents > 0
      ? Math.round(
          institutionRanking!.reduce((sum, r) => sum + r.totalPoints, 0) / totalStudents
        )
      : 0;

  const topStudents = institutionRanking?.filter((r) => r.rank <= 10) || [];

  // Agrupar por turma
  const rankingsByClass = institutionRanking?.reduce((acc, ranking) => {
    if (!ranking.class) return acc;
    const className = ranking.class.name;
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(ranking);
    return acc;
  }, {} as Record<string, any[]>);

  const classesData = rankingsByClass
    ? Object.entries(rankingsByClass).map(([name, students]) => ({
        name,
        count: students.length,
        avgPoints: Math.round(
          students.reduce((sum, s) => s.totalPoints + sum, 0) / students.length
        ),
      }))
    : [];

  const exportToCSV = () => {
    if (!institutionRanking) return;

    const headers = [
      'Posição',
      'Nome',
      'Turma',
      'Total',
      'Notas',
      'Frequência',
      'Atividades',
      'Simulados',
      'Streak',
    ];
    const rows = institutionRanking.map((r) => [
      r.rank,
      `${r.user.firstName} ${r.user.lastName}`,
      r.class?.name || '-',
      r.totalPoints,
      r.gradePoints,
      r.attendancePoints,
      r.activityPoints,
      r.examPoints,
      r.streakBonus,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Rankings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administração de rankings e conquistas
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as RankingPeriod)}
            options={periodOptions}
            className="w-40"
          />
          <Button
            onClick={() => setView(view === 'general' ? 'badges' : 'general')}
            variant="secondary"
            leftIcon={view === 'general' ? <SparklesIcon className="h-5 w-5" /> : <ChartBarIcon className="h-5 w-5" />}
          >
            {view === 'general' ? 'Ver Badges' : 'Ver Rankings'}
          </Button>
        </div>
      </div>

      {view === 'general' ? (
        <>
          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => recalculateMutation.mutate()}
              disabled={!legacyAdminActionsAvailable || recalculateMutation.isPending}
              leftIcon={<ArrowPathIcon className={`h-5 w-5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />}
              variant="secondary"
            >
              {recalculateMutation.isPending ? 'Recalculando...' : 'Recalcular Rankings'}
            </Button>
            <Button
              onClick={exportToCSV}
              leftIcon={<CloudArrowDownIcon className="h-5 w-5" />}
              variant="secondary"
            >
              Exportar CSV
            </Button>
          </div>
          {!legacyAdminActionsAvailable && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              As acoes administrativas de recalculo ainda dependem da API legada. A leitura do ranking ja foi migrada para o Supabase.
            </p>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Alunos</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {totalStudents}
                  </p>
                </div>
                <TrophyIcon className="h-12 w-12 text-primary-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Média de Pontos</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {averagePoints}
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Turmas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {classesData.length}
                  </p>
                </div>
                <Cog6ToothIcon className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 20 Geral */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top 20 Geral
                </h3>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : institutionRanking && institutionRanking.length > 0 ? (
                  <div className="space-y-2">
                    {institutionRanking.slice(0, 20).map((ranking, index) => (
                      <div
                        key={ranking.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
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
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {ranking.user.firstName} {ranking.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ranking.class?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600 dark:text-primary-400">
                            {ranking.totalPoints}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </div>

            {/* Rankings por Turma */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rankings por Turma
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {classesData.map((classData) => (
                    <div
                      key={classData.name}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {classData.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {classData.count} alunos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Média</p>
                          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                            {classData.avgPoints}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Gerenciar Badges */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gerenciar Badges
            </h3>
            <Button
              onClick={() => seedBadgesMutation.mutate()}
              disabled={!legacyAdminActionsAvailable || seedBadgesMutation.isPending}
              leftIcon={<SparklesIcon className="h-5 w-5" />}
              size="sm"
            >
              Criar Badges Padrão
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges && badges.length > 0 ? (
                badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{badge.icon || '🏆'}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {badge.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {badge.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="info" size="sm">
                            {badge.type}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {badge.rarity}
                          </Badge>
                          <Badge variant="success" size="sm">
                            +{badge.points}pts
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  Nenhum badge criado. Clique em "Criar Badges Padrão" para começar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
