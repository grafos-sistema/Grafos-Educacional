-- CreateIndex
CREATE INDEX "attendances_studentId_classSubjectId_idx" ON "attendances"("studentId", "classSubjectId");

-- CreateIndex
CREATE INDEX "attendances_classSubjectId_status_idx" ON "attendances"("classSubjectId", "status");

-- CreateIndex
CREATE INDEX "attendances_classSubjectId_date_idx" ON "attendances"("classSubjectId", "date");

-- CreateIndex
CREATE INDEX "class_enrollments_classId_status_idx" ON "class_enrollments"("classId", "status");

-- CreateIndex
CREATE INDEX "class_enrollments_studentId_status_idx" ON "class_enrollments"("studentId", "status");

-- CreateIndex
CREATE INDEX "grades_studentId_classSubjectId_idx" ON "grades"("studentId", "classSubjectId");

-- CreateIndex
CREATE INDEX "grades_classSubjectId_status_idx" ON "grades"("classSubjectId", "status");
