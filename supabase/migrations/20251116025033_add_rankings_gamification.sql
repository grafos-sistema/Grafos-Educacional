-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('GRADE', 'ATTENDANCE', 'STREAK', 'RANKING', 'ACHIEVEMENT', 'SPECIAL');

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "RankingPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME');

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'COMMON',
    "icon" TEXT,
    "color" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "period" "RankingPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "gradePoints" INTEGER NOT NULL DEFAULT 0,
    "attendancePoints" INTEGER NOT NULL DEFAULT 0,
    "activityPoints" INTEGER NOT NULL DEFAULT 0,
    "examPoints" INTEGER NOT NULL DEFAULT 0,
    "streakBonus" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT,
    "classId" TEXT,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badges_type_idx" ON "badges"("type");

-- CreateIndex
CREATE INDEX "badges_isActive_idx" ON "badges"("isActive");

-- CreateIndex
CREATE INDEX "achievements_userId_idx" ON "achievements"("userId");

-- CreateIndex
CREATE INDEX "achievements_badgeId_idx" ON "achievements"("badgeId");

-- CreateIndex
CREATE INDEX "achievements_unlockedAt_idx" ON "achievements"("unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_userId_badgeId_key" ON "achievements"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "rankings_userId_idx" ON "rankings"("userId");

-- CreateIndex
CREATE INDEX "rankings_institutionId_idx" ON "rankings"("institutionId");

-- CreateIndex
CREATE INDEX "rankings_classId_idx" ON "rankings"("classId");

-- CreateIndex
CREATE INDEX "rankings_period_idx" ON "rankings"("period");

-- CreateIndex
CREATE INDEX "rankings_periodStart_idx" ON "rankings"("periodStart");

-- CreateIndex
CREATE INDEX "rankings_rank_idx" ON "rankings"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_userId_period_periodStart_classId_key" ON "rankings"("userId", "period", "periodStart", "classId");

-- CreateIndex
CREATE INDEX "points_transactions_userId_idx" ON "points_transactions"("userId");

-- CreateIndex
CREATE INDEX "points_transactions_type_idx" ON "points_transactions"("type");

-- CreateIndex
CREATE INDEX "points_transactions_createdAt_idx" ON "points_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
