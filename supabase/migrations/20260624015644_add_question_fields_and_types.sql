/*
  Warnings:

  - Added the required column `title` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "QuestionDifficulty" ADD VALUE 'EXPERT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionType" ADD VALUE 'TRUE_FALSE';
ALTER TYPE "QuestionType" ADD VALUE 'SHORT_ANSWER';
ALTER TYPE "QuestionType" ADD VALUE 'ESSAY';
ALTER TYPE "QuestionType" ADD VALUE 'FILL_IN_BLANK';

-- AlterTable
-- Add columns with default values for existing rows
ALTER TABLE "questions" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "questions" ADD COLUMN "title" TEXT;

-- Update existing rows to have a title based on their statement (first 50 chars)
UPDATE "questions" SET "title" = LEFT("statement", 50) WHERE "title" IS NULL;

-- Now make title NOT NULL
ALTER TABLE "questions" ALTER COLUMN "title" SET NOT NULL;

-- Make institutionId optional
ALTER TABLE "questions" ALTER COLUMN "institutionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "questions_isPublic_idx" ON "questions"("isPublic");
