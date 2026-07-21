import { PrismaClient, BadgeType, BadgeRarity } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBadges() {
  console.log('🎖️  Seeding badges...');

  const badges = [
    // GRADE BADGES
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
      name: 'Nota Máxima Pro',
      description: 'Conquiste 5 notas 10',
      type: BadgeType.GRADE,
      rarity: BadgeRarity.RARE,
      icon: '⭐',
      color: '#4169E1',
      points: 200,
      criteria: { type: 'grade', value: 10, count: 5 },
    },
    {
      name: 'Gênio da Turma',
      description: 'Conquiste 10 notas acima de 9',
      type: BadgeType.GRADE,
      rarity: BadgeRarity.EPIC,
      icon: '🧠',
      color: '#9370DB',
      points: 500,
      criteria: { type: 'grade', value: 9, count: 10, operator: '>=' },
    },
    {
      name: 'Perfeição Absoluta',
      description: 'Mantenha média 10 durante um semestre',
      type: BadgeType.GRADE,
      rarity: BadgeRarity.LEGENDARY,
      icon: '👑',
      color: '#FF6347',
      points: 1000,
      criteria: { type: 'average', value: 10, period: 'semester' },
    },

    // ATTENDANCE BADGES
    {
      name: 'Sempre Presente',
      description: '100% de presença no mês',
      type: BadgeType.ATTENDANCE,
      rarity: BadgeRarity.COMMON,
      icon: '✅',
      color: '#32CD32',
      points: 100,
      criteria: { type: 'attendance', value: 100, period: 'month' },
    },
    {
      name: 'Assiduidade de Ouro',
      description: '95% de presença durante 3 meses',
      type: BadgeType.ATTENDANCE,
      rarity: BadgeRarity.RARE,
      icon: '🎯',
      color: '#FFD700',
      points: 300,
      criteria: { type: 'attendance', value: 95, period: 'quarter', operator: '>=' },
    },
    {
      name: 'Nunca Falta',
      description: '100% de presença durante um semestre',
      type: BadgeType.ATTENDANCE,
      rarity: BadgeRarity.EPIC,
      icon: '🏆',
      color: '#FF4500',
      points: 600,
      criteria: { type: 'attendance', value: 100, period: 'semester' },
    },

    // STREAK BADGES
    {
      name: 'Sequência de 7',
      description: 'Estude 7 dias consecutivos',
      type: BadgeType.STREAK,
      rarity: BadgeRarity.COMMON,
      icon: '🔥',
      color: '#FF6347',
      points: 70,
      criteria: { type: 'streak', value: 7 },
    },
    {
      name: 'Mestre da Consistência',
      description: 'Estude 30 dias consecutivos',
      type: BadgeType.STREAK,
      rarity: BadgeRarity.RARE,
      icon: '🚀',
      color: '#4169E1',
      points: 300,
      criteria: { type: 'streak', value: 30 },
    },
    {
      name: 'Dedicação Inabalável',
      description: 'Estude 90 dias consecutivos',
      type: BadgeType.STREAK,
      rarity: BadgeRarity.LEGENDARY,
      icon: '💎',
      color: '#00CED1',
      points: 1000,
      criteria: { type: 'streak', value: 90 },
    },

    // RANKING BADGES
    {
      name: 'Top 3 da Turma',
      description: 'Fique entre os 3 melhores da turma',
      type: BadgeType.RANKING,
      rarity: BadgeRarity.RARE,
      icon: '🥉',
      color: '#CD7F32',
      points: 250,
      criteria: { type: 'rank', scope: 'class', position: 3, operator: '<=' },
    },
    {
      name: 'Líder da Turma',
      description: 'Seja o 1º colocado da turma',
      type: BadgeType.RANKING,
      rarity: BadgeRarity.EPIC,
      icon: '🥇',
      color: '#FFD700',
      points: 500,
      criteria: { type: 'rank', scope: 'class', position: 1 },
    },
    {
      name: 'Campeão da Escola',
      description: 'Seja o 1º colocado da escola',
      type: BadgeType.RANKING,
      rarity: BadgeRarity.LEGENDARY,
      icon: '🏅',
      color: '#FF1493',
      points: 1500,
      criteria: { type: 'rank', scope: 'institution', position: 1 },
    },

    // ACHIEVEMENT BADGES
    {
      name: 'Mão na Massa',
      description: 'Complete 10 atividades',
      type: BadgeType.ACHIEVEMENT,
      rarity: BadgeRarity.COMMON,
      icon: '📝',
      color: '#20B2AA',
      points: 100,
      criteria: { type: 'activities', count: 10 },
    },
    {
      name: 'Entrega Perfeita',
      description: 'Entregue 20 atividades no prazo',
      type: BadgeType.ACHIEVEMENT,
      rarity: BadgeRarity.RARE,
      icon: '⏰',
      color: '#FF8C00',
      points: 300,
      criteria: { type: 'activities', count: 20, onTime: true },
    },
    {
      name: 'Simulado Master',
      description: 'Complete 5 simulados SAEB',
      type: BadgeType.ACHIEVEMENT,
      rarity: BadgeRarity.EPIC,
      icon: '📊',
      color: '#9370DB',
      points: 500,
      criteria: { type: 'exams', subtype: 'SAEB', count: 5 },
    },
    {
      name: 'Evolução Notável',
      description: 'Melhore sua média em 20% ou mais',
      type: BadgeType.ACHIEVEMENT,
      rarity: BadgeRarity.EPIC,
      icon: '📈',
      color: '#32CD32',
      points: 600,
      criteria: { type: 'improvement', value: 20, unit: 'percent' },
    },

    // SPECIAL BADGES
    {
      name: 'Pioneiro',
      description: 'Seja um dos primeiros usuários do sistema',
      type: BadgeType.SPECIAL,
      rarity: BadgeRarity.LEGENDARY,
      icon: '🎖️',
      color: '#8B008B',
      points: 1000,
      criteria: { type: 'special', code: 'early_adopter' },
    },
    {
      name: 'Ajudante',
      description: 'Ajude 5 colegas com dúvidas',
      type: BadgeType.SPECIAL,
      rarity: BadgeRarity.RARE,
      icon: '🤝',
      color: '#FF69B4',
      points: 200,
      criteria: { type: 'social', action: 'help', count: 5 },
    },
  ];

  for (const badge of badges) {
    // Check if badge exists by name
    const existing = await prisma.badge.findFirst({
      where: { name: badge.name },
    });

    if (existing) {
      await prisma.badge.update({
        where: { id: existing.id },
        data: badge,
      });
    } else {
      await prisma.badge.create({
        data: badge,
      });
    }
  }

  const count = await prisma.badge.count();
  console.log(`✅ ${count} badges seeded successfully!`);
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedBadges()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
