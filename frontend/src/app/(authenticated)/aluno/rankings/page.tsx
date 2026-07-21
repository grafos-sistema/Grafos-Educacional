'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rankingsService, RankingPeriod } from '@/services/rankings.service';
import { achievementsService } from '@/services/achievements.service';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { TrophyIcon, FireIcon, StarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

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

export default function StudentRankingsPage() {
  const [period, setPeriod] = useState<RankingPeriod>(RankingPeriod.MONTHLY);

  // Buscar meu ranking
  const { data: myRanking, isLoading: loadingMyRanking } = useQuery({
    queryKey: ['my-ranking', period],
    queryFn: () => rankingsService.getMyRanking(period),
  });

  // Buscar ranking da turma
  const { data: classRanking, isLoading: loadingClassRanking } = useQuery({
    queryKey: ['class-ranking', myRanking?.class?.id, period],
    queryFn: () => {
      if (!myRanking?.class?.id) return [];
      return rankingsService.getClassRanking(myRanking.class.id, period, 10);
    },
    enabled: !!myRanking?.class?.id,
  });

  // Buscar minhas conquistas
  const { data: achievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => achievementsService.getMyAchievements(),
  });

  // Buscar histórico de ranking
  const { data: rankingHistory } = useQuery({
    queryKey: ['my-ranking-history'],
    queryFn: () => rankingsService.getMyRankingHistory(6),
  });

  const getRankChange = () => {
    if (!myRanking || !myRanking.previousRank) return null;
    const change = myRanking.previousRank - myRanking.rank;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  const rankChange = getRankChange();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'from-yellow-400 to-orange-500';
      case 'EPIC':
        return 'from-purple-400 to-pink-500';
      case 'RARE':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rankings e Conquistas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe sua evolução e conquistas
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

      {/* Minha Posição */}
      {myRanking && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Sua Posição Atual</p>
              <div className="flex items-baseline gap-3 mt-2">
                <h2 className="text-5xl font-bold">#{myRanking.rank}</h2>
                {rankChange && rankChange.type !== 'same' && (
                  <span
                    className={`text-lg font-medium ${
                      rankChange.type === 'up' ? 'text-green-200' : 'text-red-200'
                    }`}
                  >
                    {rankChange.type === 'up' ? '↑' : '↓'} {rankChange.value}
                  </span>
                )}
              </div>
              <p className="mt-2 opacity-90">
                {myRanking.class?.name} • {myRanking.totalPoints} pontos
              </p>
            </div>
            <TrophyIcon className="h-24 w-24 opacity-20" />
          </div>

          {/* Breakdown de Pontos */}
          <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <p className="text-xs opacity-75">Notas</p>
              <p className="text-lg font-semibold">{myRanking.gradePoints}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Frequência</p>
              <p className="text-lg font-semibold">{myRanking.attendancePoints}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Atividades</p>
              <p className="text-lg font-semibold">{myRanking.activityPoints}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Simulados</p>
              <p className="text-lg font-semibold">{myRanking.examPoints}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Streak</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <FireIcon className="h-4 w-4" />
                {myRanking.streakBonus}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking da Turma */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Top 10 da Turma
              </h3>
            </div>
            <div className="p-6">
              {loadingClassRanking ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : classRanking && classRanking.length > 0 ? (
                <div className="space-y-3">
                  {classRanking.map((ranking, index) => (
                    <div
                      key={ranking.id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        ranking.user.id === myRanking?.user.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                          : 'bg-gray-50 dark:bg-gray-700/50'
                      }`}
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
                      {ranking.user.avatar ? (
                        <img
                          src={ranking.user.avatar}
                          alt={`${ranking.user.firstName} ${ranking.user.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                          {ranking.user.firstName[0]}{ranking.user.lastName[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ranking.user.firstName} {ranking.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {ranking.totalPoints} pontos
                        </p>
                      </div>
                      {index < 3 && (
                        <TrophyIcon
                          className={`h-6 w-6 ${
                            index === 0
                              ? 'text-yellow-500'
                              : index === 1
                              ? 'text-gray-400'
                              : 'text-orange-400'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado de ranking disponível
                </div>
              )}
            </div>
          </div>

          {/* Histórico */}
          {rankingHistory && rankingHistory.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evolução do Ranking
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {rankingHistory.map((ranking) => (
                  <div
                    key={ranking.id}
                    className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      #{ranking.rank}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(ranking.periodStart).toLocaleDateString('pt-BR', {
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {ranking.totalPoints}pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conquistas */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <StarIcon className="h-5 w-5" />
                Minhas Conquistas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {achievements?.length || 0} badges desbloqueados
              </p>
            </div>
            <div className="p-6">
              {loadingAchievements ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-lg bg-gradient-to-br ${getRarityColor(
                        achievement.badge.rarity,
                      )} text-white text-center`}
                      title={achievement.badge.description}
                    >
                      <div className="text-3xl mb-2">{achievement.badge.icon || '🏆'}</div>
                      <p className="text-xs font-semibold">{achievement.badge.name}</p>
                      <p className="text-xs opacity-75 mt-1">
                        +{achievement.badge.points}pts
                      </p>
                      <div className="absolute top-1 right-1">
                        <Badge
                          variant="default"
                          size="sm"
                          className="text-xs"
                        >
                          {achievement.badge.rarity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma conquista ainda. Continue estudando!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
