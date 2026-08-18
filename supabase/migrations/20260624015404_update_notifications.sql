/*
  Warnings:

  - Added the required column `userId` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "NotificationType" ADD VALUE 'USER_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'GRADE_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_ASSIGNMENT';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
