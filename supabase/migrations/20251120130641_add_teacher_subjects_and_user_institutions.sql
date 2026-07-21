-- CreateTable
CREATE TABLE "user_institutions" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "user_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_institutions_userId_idx" ON "user_institutions"("userId");

-- CreateIndex
CREATE INDEX "user_institutions_institutionId_idx" ON "user_institutions"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_institutions_userId_institutionId_key" ON "user_institutions"("userId", "institutionId");

-- CreateIndex
CREATE INDEX "teacher_subjects_teacherId_idx" ON "teacher_subjects"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_subjects_subjectId_idx" ON "teacher_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacherId_subjectId_key" ON "teacher_subjects"("teacherId", "subjectId");

-- AddForeignKey
ALTER TABLE "user_institutions" ADD CONSTRAINT "user_institutions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_institutions" ADD CONSTRAINT "user_institutions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "unique_cpf_per_institution" RENAME TO "users_cpf_institutionId_key";

-- RenameIndex
ALTER INDEX "unique_email_per_institution" RENAME TO "users_email_institutionId_key";
