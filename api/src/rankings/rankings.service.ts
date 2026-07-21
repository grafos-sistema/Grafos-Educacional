import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankingPeriod } from '@prisma/client';

@Injectable()
export class RankingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obter ranking de alunos por turma
   */
  async getClassRanking(
    classId: string,
    period: RankingPeriod = RankingPeriod.MONTHLY,
    limit = 20,
  ) {
    const periodDates = this.getPeriodDates(period);

    const rankings = await this.prisma.ranking.findMany({
      where: {
        classId,
        period,
        periodStart: periodDates.start,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            studentProfile: {
              select: {
                registrationNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
      take: limit,
    });

    return rankings;
  }

  /**
   * Obter ranking geral da instituição
   */
  async getInstitutionRanking(
    institutionId: string,
    period: RankingPeriod = RankingPeriod.MONTHLY,
    limit = 50,
  ) {
    const periodDates = this.getPeriodDates(period);

    const rankings = await this.prisma.ranking.findMany({
      where: {
        institutionId,
        period,
        periodStart: periodDates.start,
        classId: { not: null }, // Apenas alunos que têm turma
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            studentProfile: {
              select: {
                registrationNumber: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
      take: limit,
    });

    return rankings;
  }

  /**
   * Obter ranking de um usuário específico
   */
  async getUserRanking(
    userId: string,
    period: RankingPeriod = RankingPeriod.MONTHLY,
  ) {
    const periodDates = this.getPeriodDates(period);

    const ranking = await this.prisma.ranking.findFirst({
      where: {
        userId,
        period,
        periodStart: periodDates.start,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!ranking) {
      throw new NotFoundException('Ranking não encontrado para este período');
    }

    return ranking;
  }

  /**
   * Obter histórico de ranking de um usuário
   */
  async getUserRankingHistory(userId: string, limit = 12) {
    const rankings = await this.prisma.ranking.findMany({
      where: {
        userId,
      },
      orderBy: {
        periodStart: 'desc',
      },
      take: limit,
    });

    return rankings;
  }

  /**
   * Adicionar pontos a um usuário
   */
  async addPoints(
    userId: string,
    points: number,
    type: string,
    description: string,
    metadata?: any,
  ) {
    // Criar transação de pontos
    const transaction = await this.prisma.pointsTransaction.create({
      data: {
        userId,
        points,
        type,
        description,
        metadata,
      },
    });

    // Atualizar ranking atual
    await this.updateUserRanking(userId);

    return transaction;
  }

  /**
   * Atualizar ranking de um usuário (recalcular pontos e posição)
   */
  async updateUserRanking(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            classEnrollments: {
              where: { isActive: true },
              include: { class: true },
            },
          },
        },
      },
    });

    if (!user || !user.studentProfile) {
      return null; // Apenas alunos têm ranking
    }

    const activeEnrollment = user.studentProfile.classEnrollments[0];
    if (!activeEnrollment) {
      return null;
    }

    const period = RankingPeriod.MONTHLY;
    const periodDates = this.getPeriodDates(period);

    // Calcular pontos do período atual
    const points = await this.calculateUserPoints(
      userId,
      periodDates.start,
      periodDates.end,
    );

    // Criar ou atualizar ranking
    const ranking = await this.prisma.ranking.upsert({
      where: {
        userId_period_periodStart_classId: {
          userId,
          period,
          periodStart: periodDates.start,
          classId: activeEnrollment.classId,
        },
      },
      update: {
        totalPoints: points.total,
        gradePoints: points.grades,
        attendancePoints: points.attendance,
        activityPoints: points.activities,
        examPoints: points.exams,
        streakBonus: points.streak,
      },
      create: {
        userId,
        institutionId: user.institutionId,
        classId: activeEnrollment.classId,
        period,
        periodStart: periodDates.start,
        periodEnd: periodDates.end,
        totalPoints: points.total,
        gradePoints: points.grades,
        attendancePoints: points.attendance,
        activityPoints: points.activities,
        examPoints: points.exams,
        streakBonus: points.streak,
        rank: 999, // Será atualizado pelo recalculateClassRankings
      },
    });

    // Recalcular posições da turma
    await this.recalculateClassRankings(
      activeEnrollment.classId,
      period,
      periodDates.start,
    );

    return ranking;
  }

  /**
   * Recalcular posições de ranking de uma turma
   */
  async recalculateClassRankings(
    classId: string,
    period: RankingPeriod,
    periodStart: Date,
  ) {
    const rankings = await this.prisma.ranking.findMany({
      where: {
        classId,
        period,
        periodStart,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    // Atualizar ranks
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      await this.prisma.ranking.update({
        where: { id: ranking.id },
        data: {
          previousRank: ranking.rank,
          rank: i + 1,
        },
      });
    }
  }

  /**
   * Calcular pontos de um usuário em um período
   */
  private async calculateUserPoints(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Pontos por notas (soma de transações de pontos do tipo "grade")
    const gradeTransactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        type: 'grade',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    const gradePoints = gradeTransactions.reduce(
      (sum, t) => sum + t.points,
      0,
    );

    // Pontos por frequência
    const attendanceTransactions = await this.prisma.pointsTransaction.findMany(
      {
        where: {
          userId,
          type: 'attendance',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    );
    const attendancePoints = attendanceTransactions.reduce(
      (sum, t) => sum + t.points,
      0,
    );

    // Pontos por atividades
    const activityTransactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        type: 'activity',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    const activityPoints = activityTransactions.reduce(
      (sum, t) => sum + t.points,
      0,
    );

    // Pontos por exames/simulados
    const examTransactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        type: 'exam',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    const examPoints = examTransactions.reduce((sum, t) => sum + t.points, 0);

    // Bônus de streak
    const streakTransactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        type: 'streak',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    const streakBonus = streakTransactions.reduce((sum, t) => sum + t.points, 0);

    const total =
      gradePoints +
      attendancePoints +
      activityPoints +
      examPoints +
      streakBonus;

    return {
      total,
      grades: gradePoints,
      attendance: attendancePoints,
      activities: activityPoints,
      exams: examPoints,
      streak: streakBonus,
    };
  }

  /**
   * Obter datas de início e fim de um período
   */
  private getPeriodDates(period: RankingPeriod) {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case RankingPeriod.WEEKLY:
        // Começo da semana (domingo)
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        // Fim da semana (sábado)
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case RankingPeriod.MONTHLY:
        // Primeiro dia do mês
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        // Último dia do mês
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case RankingPeriod.QUARTERLY:
        // Primeiro dia do trimestre
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        // Último dia do trimestre
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case RankingPeriod.YEARLY:
        // Primeiro dia do ano
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        // Último dia do ano
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      case RankingPeriod.ALL_TIME:
        // Desde o início (2020-01-01)
        start = new Date(2020, 0, 1);
        start.setHours(0, 0, 0, 0);
        // Até agora
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Recalcular todos os rankings (cron job diário)
   */
  async recalculateAllRankings() {
    // Buscar todos os alunos ativos com enrollment
    const students = await this.prisma.student.findMany({
      where: {
        isActive: true,
      },
      include: {
        classEnrollments: {
          where: { isActive: true },
        },
        user: true,
      },
    });

    let updated = 0;
    for (const student of students) {
      try {
        await this.updateUserRanking(student.userId);
        updated++;
      } catch (error) {
        console.error(
          `Erro ao atualizar ranking do aluno ${student.userId}:`,
          error,
        );
      }
    }

    return { updated, total: students.length };
  }
}
