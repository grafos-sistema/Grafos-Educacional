import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType, BadgeRarity } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Listar todos os badges disponíveis
   */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'desc' }, { points: 'desc' }],
    });
  }

  /**
   * Listar conquistas de um usuário
   */
  async getUserAchievements(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });
  }

  /**
   * Desbloquear um badge para um usuário
   */
  async unlockBadge(userId: string, badgeId: string) {
    // Verificar se já possui
    const existing = await this.prisma.achievement.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (existing) {
      return existing; // Já possui
    }

    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new Error('Badge não encontrado');
    }

    // Criar achievement
    const achievement = await this.prisma.achievement.create({
      data: {
        userId,
        badgeId,
      },
      include: {
        badge: true,
      },
    });

    // Adicionar pontos do badge
    if (badge.points > 0) {
      await this.prisma.pointsTransaction.create({
        data: {
          userId,
          points: badge.points,
          type: 'badge',
          description: `Conquistou: ${badge.name}`,
          metadata: { badgeId, achievementId: achievement.id },
        },
      });
    }

    // Notificar usuário
    await this.notificationsService.create(
      userId,
      'SYSTEM' as any,
      `Conquista desbloqueada: ${badge.name}!`,
      badge.description,
      {
        achievementId: achievement.id,
        badgeId,
        badge: {
          icon: badge.icon,
          color: badge.color,
          rarity: badge.rarity,
          points: badge.points,
        },
      },
    );

    return achievement;
  }

  /**
   * Verificar e desbloquear badges automaticamente para um usuário
   */
  async checkAndUnlockBadges(userId: string) {
    const allBadges = await this.getAllBadges();
    const userAchievements = await this.getUserAchievements(userId);
    const unlockedBadgeIds = new Set(
      userAchievements.map((a) => a.badgeId),
    );

    const newAchievements: any[] = [];

    for (const badge of allBadges) {
      // Se já possui, pular
      if (unlockedBadgeIds.has(badge.id)) {
        continue;
      }

      // Verificar critério
      const unlocked = await this.checkBadgeCriteria(userId, badge);
      if (unlocked) {
        const achievement = await this.unlockBadge(userId, badge.id);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  /**
   * Verificar se um usuário atende o critério de um badge
   */
  private async checkBadgeCriteria(userId: string, badge: any): Promise<boolean> {
    const criteria = badge.criteria as any;

    switch (badge.type) {
      case BadgeType.GRADE:
        return this.checkGradeCriteria(userId, criteria);

      case BadgeType.ATTENDANCE:
        return this.checkAttendanceCriteria(userId, criteria);

      case BadgeType.STREAK:
        return this.checkStreakCriteria(userId, criteria);

      case BadgeType.RANKING:
        return this.checkRankingCriteria(userId, criteria);

      case BadgeType.ACHIEVEMENT:
        return this.checkAchievementCriteria(userId, criteria);

      default:
        return false;
    }
  }

  private async checkGradeCriteria(userId: string, criteria: any): Promise<boolean> {
    // Exemplo: { "type": "grade", "value": 10, "count": 1 }
    // Verificar se tem pelo menos X notas com valor Y
    const gradesCount = await this.prisma.grade.count({
      where: {
        studentId: userId,
        value: { gte: criteria.value },
      },
    });

    return gradesCount >= (criteria.count || 1);
  }

  private async checkAttendanceCriteria(
    userId: string,
    criteria: any,
  ): Promise<boolean> {
    // Exemplo: { "type": "attendance", "percentage": 100, "period": "monthly" }
    // Calcular % de presença no período
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalClasses = await this.prisma.attendance.count({
      where: {
        studentId: userId,
        date: { gte: startOfMonth },
      },
    });

    if (totalClasses === 0) return false;

    const presentCount = await this.prisma.attendance.count({
      where: {
        studentId: userId,
        date: { gte: startOfMonth },
        status: 'PRESENT',
      },
    });

    const percentage = (presentCount / totalClasses) * 100;
    return percentage >= (criteria.percentage || 100);
  }

  private async checkStreakCriteria(userId: string, criteria: any): Promise<boolean> {
    // Exemplo: { "type": "streak", "days": 7 }
    // Verificar se tem X dias consecutivos de atividade
    // (Simplificado - verificar transações de pontos nos últimos X dias)
    const daysRequired = criteria.days || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysRequired);

    const transactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por dia
    const daysWithActivity = new Set();
    transactions.forEach((t) => {
      const day = t.createdAt.toISOString().split('T')[0];
      daysWithActivity.add(day);
    });

    return daysWithActivity.size >= daysRequired;
  }

  private async checkRankingCriteria(userId: string, criteria: any): Promise<boolean> {
    // Exemplo: { "type": "ranking", "position": 3, "period": "MONTHLY" }
    // Verificar se está entre os top X
    const period = criteria.period || 'MONTHLY';

    const ranking = await this.prisma.ranking.findFirst({
      where: {
        userId,
        period,
      },
      orderBy: { periodStart: 'desc' },
    });

    if (!ranking) return false;

    return ranking.rank <= (criteria.position || 3);
  }

  private async checkAchievementCriteria(
    userId: string,
    criteria: any,
  ): Promise<boolean> {
    // Exemplo: { "type": "achievement", "activityCount": 10 }
    // Verificar se completou X atividades
    if (criteria.activityCount) {
      const count = await this.prisma.pointsTransaction.count({
        where: {
          userId,
          type: 'activity',
        },
      });
      return count >= criteria.activityCount;
    }

    return false;
  }

  /**
   * Seed inicial de badges
   */
  async seedBadges() {
    const badges = [
      // Badges de Notas
      {
        name: 'Primeira Nota 10',
        description: 'Conquiste sua primeira nota 10!',
        type: BadgeType.GRADE,
        rarity: BadgeRarity.COMMON,
        icon: '🌟',
        color: '#FFD700',
        points: 50,
        criteria: { type: 'grade', value: 10, count: 1 },
      },
      {
        name: 'Excelência Acadêmica',
        description: 'Conquiste 10 notas acima de 9.0',
        type: BadgeType.GRADE,
        rarity: BadgeRarity.RARE,
        icon: '🏆',
        color: '#C0C0C0',
        points: 200,
        criteria: { type: 'grade', value: 9, count: 10 },
      },

      // Badges de Frequência
      {
        name: '100% Presente',
        description: 'Tenha 100% de presença no mês',
        type: BadgeType.ATTENDANCE,
        rarity: BadgeRarity.COMMON,
        icon: '✅',
        color: '#00FF00',
        points: 100,
        criteria: { type: 'attendance', percentage: 100, period: 'monthly' },
      },

      // Badges de Streak
      {
        name: 'Semana Dedicada',
        description: 'Estude 7 dias consecutivos',
        type: BadgeType.STREAK,
        rarity: BadgeRarity.COMMON,
        icon: '🔥',
        color: '#FF4500',
        points: 75,
        criteria: { type: 'streak', days: 7 },
      },
      {
        name: 'Maratona de Estudos',
        description: 'Estude 30 dias consecutivos',
        type: BadgeType.STREAK,
        rarity: BadgeRarity.EPIC,
        icon: '🚀',
        color: '#9932CC',
        points: 500,
        criteria: { type: 'streak', days: 30 },
      },

      // Badges de Ranking
      {
        name: 'Top 3 da Turma',
        description: 'Fique entre os 3 primeiros do ranking mensal',
        type: BadgeType.RANKING,
        rarity: BadgeRarity.RARE,
        icon: '🥉',
        color: '#CD7F32',
        points: 300,
        criteria: { type: 'ranking', position: 3, period: 'MONTHLY' },
      },
      {
        name: 'Campeão da Turma',
        description: 'Fique em 1º lugar no ranking mensal',
        type: BadgeType.RANKING,
        rarity: BadgeRarity.LEGENDARY,
        icon: '👑',
        color: '#FFD700',
        points: 1000,
        criteria: { type: 'ranking', position: 1, period: 'MONTHLY' },
      },

      // Badges de Atividades
      {
        name: 'Primeira Atividade',
        description: 'Complete sua primeira atividade',
        type: BadgeType.ACHIEVEMENT,
        rarity: BadgeRarity.COMMON,
        icon: '📝',
        color: '#1E90FF',
        points: 25,
        criteria: { type: 'achievement', activityCount: 1 },
      },
      {
        name: 'Estudante Aplicado',
        description: 'Complete 50 atividades',
        type: BadgeType.ACHIEVEMENT,
        rarity: BadgeRarity.EPIC,
        icon: '📚',
        color: '#4B0082',
        points: 500,
        criteria: { type: 'achievement', activityCount: 50 },
      },
    ];

    const created: any[] = [];
    for (const badgeData of badges) {
      const existing = await this.prisma.badge.findFirst({
        where: { name: badgeData.name },
      });

      if (!existing) {
        const badge = await this.prisma.badge.create({
          data: badgeData,
        });
        created.push(badge);
      }
    }

    return { created: created.length, total: badges.length };
  }
}
