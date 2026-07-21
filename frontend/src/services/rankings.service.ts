import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';

export enum RankingPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ALL_TIME = 'ALL_TIME',
}

export interface Ranking {
  id: string;
  period: RankingPeriod;
  periodStart: string;
  periodEnd: string;
  totalPoints: number;
  rank: number;
  previousRank?: number;
  gradePoints: number;
  attendancePoints: number;
  activityPoints: number;
  examPoints: number;
  streakBonus: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    studentProfile?: {
      registrationNumber: string;
    };
  };
  class?: {
    id: string;
    name: string;
    grade: string;
  };
}

type RankingRow = {
  id: string;
  period: RankingPeriod;
  periodStart: string;
  periodEnd: string;
  totalPoints: number;
  rank: number;
  previousRank: number | null;
  gradePoints: number;
  attendancePoints: number;
  activityPoints: number;
  examPoints: number;
  streakBonus: number;
  userId: string;
  classId: string | null;
};

type RankingUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
};

type RankingPublicProfileRow = {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
};

type RankingClassRow = {
  id: string;
  name: string;
  grade: string;
};

function isMissingRankingProfilesRelation(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === 'PGRST205' ||
    /Could not find the table/i.test(error.message ?? '') ||
    /relation .*ranking_public_profiles.* does not exist/i.test(error.message ?? '')
  );
}

async function getRankingUsersMap(userIds: string[]) {
  const usersById = new Map<string, RankingUserRow>();

  if (userIds.length === 0) {
    return usersById;
  }

  const { data: publicProfiles, error: publicProfilesError } = await supabase
    .from('ranking_public_profiles')
    .select('userId, firstName, lastName, avatar')
    .in('userId', userIds);

  if (publicProfilesError && !isMissingRankingProfilesRelation(publicProfilesError)) {
    throw publicProfilesError;
  }

  (publicProfiles ?? []).forEach((profile) => {
    const item = profile as RankingPublicProfileRow;
    usersById.set(item.userId, {
      id: item.userId,
      firstName: item.firstName,
      lastName: item.lastName,
      avatar: item.avatar ?? null,
    });
  });

  const missingUserIds = userIds.filter((userId) => !usersById.has(userId));

  if (missingUserIds.length === 0) {
    return usersById;
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, firstName, lastName, avatar')
    .in('id', missingUserIds);

  if (usersError) {
    throw usersError;
  }

  (users ?? []).forEach((user) => {
    const item = user as RankingUserRow;
    usersById.set(item.id, item);
  });

  return usersById;
}

async function getLatestPeriodStart(
  period: RankingPeriod,
  filters: Record<string, string | null | undefined>,
): Promise<string | null> {
  let query = supabase
    .from('rankings')
    .select('periodStart')
    .eq('period', period)
    .order('periodStart', { ascending: false })
    .limit(1);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data?.periodStart ?? null;
}

async function enrichRankings(rows: RankingRow[]): Promise<Ranking[]> {
  if (rows.length === 0) {
    return [];
  }

  const userIds = Array.from(new Set(rows.map((row) => row.userId)));
  const classIds = Array.from(
    new Set(rows.map((row) => row.classId).filter((value): value is string => Boolean(value))),
  );

  const [usersById, { data: classes, error: classesError }] = await Promise.all([
    getRankingUsersMap(userIds),
    classIds.length > 0
      ? supabase.from('classes').select('id, name, grade').in('id', classIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (classesError) {
    throw classesError;
  }

  const classesById = new Map((classes ?? []).map((classItem) => [classItem.id, classItem as RankingClassRow]));

  return rows.map((row) => {
    const user = usersById.get(row.userId);
    const classItem = row.classId ? classesById.get(row.classId) : undefined;

    return {
      id: row.id,
      period: row.period,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      totalPoints: row.totalPoints,
      rank: row.rank,
      previousRank: row.previousRank ?? undefined,
      gradePoints: row.gradePoints,
      attendancePoints: row.attendancePoints,
      activityPoints: row.activityPoints,
      examPoints: row.examPoints,
      streakBonus: row.streakBonus,
      user: {
        id: user?.id ?? row.userId,
        firstName: user?.firstName ?? 'Usuário',
        lastName: user?.lastName ?? '',
        avatar: user?.avatar ?? undefined,
      },
      class: classItem
        ? {
            id: classItem.id,
            name: classItem.name,
            grade: classItem.grade,
          }
        : undefined,
    };
  });
}

async function fetchRankingRows(
  period: RankingPeriod,
  filters: Record<string, string | null | undefined>,
  limit: number,
): Promise<Ranking[]> {
  const latestPeriodStart = await getLatestPeriodStart(period, filters);

  if (!latestPeriodStart) {
    return [];
  }

  let query = supabase
    .from('rankings')
    .select(
      'id, period, periodStart, periodEnd, totalPoints, rank, previousRank, gradePoints, attendancePoints, activityPoints, examPoints, streakBonus, userId, classId',
    )
    .eq('period', period)
    .eq('periodStart', latestPeriodStart)
    .order('rank', { ascending: true })
    .limit(limit);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return enrichRankings((data ?? []) as RankingRow[]);
}

export const rankingsService = {
  /**
   * Obter ranking de uma turma
   */
  async getClassRanking(
    classId: string,
    period: RankingPeriod = RankingPeriod.MONTHLY,
    limit = 20,
  ): Promise<Ranking[]> {
    return fetchRankingRows(period, { classId }, limit);
  },

  /**
   * Obter ranking geral da instituição
   */
  async getInstitutionRanking(
    institutionId: string,
    period: RankingPeriod = RankingPeriod.MONTHLY,
    limit = 50,
  ): Promise<Ranking[]> {
    return fetchRankingRows(period, { institutionId }, limit);
  },

  /**
   * Obter ranking de um usuário
   */
  async getUserRanking(
    userId: string,
    period: RankingPeriod = RankingPeriod.MONTHLY,
  ): Promise<Ranking> {
    const rankings = await fetchRankingRows(period, { userId }, 1);

    if (!rankings[0]) {
      throw new Error('Ranking não encontrado para este período');
    }

    return rankings[0];
  },

  /**
   * Obter meu ranking
   */
  async getMyRanking(period: RankingPeriod = RankingPeriod.MONTHLY): Promise<Ranking> {
    const profile = await fetchCurrentUserProfile();
    return this.getUserRanking(profile.id, period);
  },

  /**
   * Obter histórico de ranking de um usuário
   */
  async getUserRankingHistory(userId: string, limit = 12): Promise<Ranking[]> {
    const { data, error } = await supabase
      .from('rankings')
      .select(
        'id, period, periodStart, periodEnd, totalPoints, rank, previousRank, gradePoints, attendancePoints, activityPoints, examPoints, streakBonus, userId, classId',
      )
      .eq('userId', userId)
      .order('periodStart', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return enrichRankings((data ?? []) as RankingRow[]);
  },

  /**
   * Obter meu histórico de ranking
   */
  async getMyRankingHistory(limit = 12): Promise<Ranking[]> {
    const profile = await fetchCurrentUserProfile();
    return this.getUserRankingHistory(profile.id, limit);
  },

  /**
   * Recalcular todos os rankings (Admin only)
   */
  async recalculateAll(): Promise<{ updated: number; total: number }> {
    throw new Error(
      'A recalculacao de rankings ainda depende da API administrativa legada e sera migrada em uma etapa separada.',
    );
  },

  /**
   * Atualizar ranking de um usuário
   */
  async updateUserRanking(userId: string): Promise<Ranking> {
    throw new Error(
      `A atualizacao manual do ranking de ${userId} ainda depende da API administrativa legada.`,
    );
  },
};
