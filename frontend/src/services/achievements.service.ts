import { fetchCurrentUserProfile } from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';

export enum BadgeType {
  GRADE = 'GRADE',
  ATTENDANCE = 'ATTENDANCE',
  STREAK = 'STREAK',
  RANKING = 'RANKING',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SPECIAL = 'SPECIAL',
}

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  rarity: BadgeRarity;
  icon?: string;
  color?: string;
  points: number;
  criteria: any;
  isActive: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  unlockedAt: string;
  userId: string;
  badgeId: string;
  badge: Badge;
}

type AchievementRow = {
  id: string;
  unlockedAt: string;
  userId: string;
  badgeId: string;
};

async function getBadgesMap(badgeIds: string[]) {
  if (badgeIds.length === 0) {
    return new Map<string, Badge>();
  }

  const { data, error } = await supabase
    .from('badges')
    .select('id, name, description, type, rarity, icon, color, points, criteria, isActive, createdAt')
    .in('id', badgeIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((badge) => [badge.id, badge as Badge]));
}

async function mapAchievements(rows: AchievementRow[]): Promise<Achievement[]> {
  const badgesById = await getBadgesMap(Array.from(new Set(rows.map((row) => row.badgeId))));

  return rows
    .map((row) => {
      const badge = badgesById.get(row.badgeId);

      if (!badge) {
        return null;
      }

      return {
        id: row.id,
        unlockedAt: row.unlockedAt,
        userId: row.userId,
        badgeId: row.badgeId,
        badge,
      };
    })
    .filter((achievement): achievement is Achievement => achievement !== null);
}

export const achievementsService = {
  /**
   * Listar todos os badges disponíveis
   */
  async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('id, name, description, type, rarity, icon, color, points, criteria, isActive, createdAt')
      .eq('isActive', true)
      .order('points', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as Badge[];
  },

  /**
   * Listar conquistas de um usuário
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, unlockedAt, userId, badgeId')
      .eq('userId', userId)
      .order('unlockedAt', { ascending: false });

    if (error) {
      throw error;
    }

    return mapAchievements((data ?? []) as AchievementRow[]);
  },

  /**
   * Listar minhas conquistas
   */
  async getMyAchievements(): Promise<Achievement[]> {
    const profile = await fetchCurrentUserProfile();
    return this.getUserAchievements(profile.id);
  },

  /**
   * Verificar e desbloquear badges automaticamente
   */
  async checkAndUnlockBadges(userId: string): Promise<Achievement[]> {
    throw new Error(
      `A verificacao automatica de badges para ${userId} ainda depende da API administrativa legada.`,
    );
  },

  /**
   * Seed de badges iniciais (Admin only)
   */
  async seedBadges(): Promise<{ created: number; total: number }> {
    throw new Error(
      'O seed de badges ainda depende da API administrativa legada e sera migrado em uma etapa separada.',
    );
  },
};
