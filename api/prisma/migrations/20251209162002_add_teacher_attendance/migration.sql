-- CreateTable
CREATE TABLE "teacher_attendances" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,

    CONSTRAINT "teacher_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_attendances_teacherId_idx" ON "teacher_attendances"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_attendances_classId_idx" ON "teacher_attendances"("classId");

-- CreateIndex
CREATE INDEX "teacher_attendances_classSubjectId_idx" ON "teacher_attendances"("classSubjectId");

-- CreateIndex
CREATE INDEX "teacher_attendances_date_idx" ON "teacher_attendances"("date");

-- CreateIndex
CREATE INDEX "teacher_attendances_teacherId_date_idx" ON "teacher_attendances"("teacherId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_attendances_teacherId_classSubjectId_date_key" ON "teacher_attendances"("teacherId", "classSubjectId", "date");

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "class_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
