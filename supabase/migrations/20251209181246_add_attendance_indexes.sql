-- CreateIndex
CREATE INDEX "attendances_teacherId_date_idx" ON "attendances"("teacherId", "date");

-- CreateIndex
CREATE INDEX "teacher_attendances_classSubjectId_date_idx" ON "teacher_attendances"("classSubjectId", "date");

-- CreateIndex
CREATE INDEX "teacher_attendances_teacherId_classSubjectId_idx" ON "teacher_attendances"("teacherId", "classSubjectId");
