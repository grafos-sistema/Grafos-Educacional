-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "mainTeacherId" TEXT;

-- CreateTable
CREATE TABLE "class_subject_requests" (
    "id" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "class_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_subject_requests_classId_idx" ON "class_subject_requests"("classId");

-- CreateIndex
CREATE INDEX "class_subject_requests_subjectId_idx" ON "class_subject_requests"("subjectId");

-- CreateIndex
CREATE INDEX "class_subject_requests_teacherId_idx" ON "class_subject_requests"("teacherId");

-- CreateIndex
CREATE INDEX "class_subject_requests_status_idx" ON "class_subject_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "class_subject_requests_classId_subjectId_teacherId_key" ON "class_subject_requests"("classId", "subjectId", "teacherId");

-- CreateIndex
CREATE INDEX "classes_mainTeacherId_idx" ON "classes"("mainTeacherId");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_mainTeacherId_fkey" FOREIGN KEY ("mainTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject_requests" ADD CONSTRAINT "class_subject_requests_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject_requests" ADD CONSTRAINT "class_subject_requests_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject_requests" ADD CONSTRAINT "class_subject_requests_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject_requests" ADD CONSTRAINT "class_subject_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
