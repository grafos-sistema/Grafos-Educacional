-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('SAEB', 'DIAGNOSTIC', 'FORMATIVE', 'SUMMATIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "saebDescriptorId" TEXT;

-- CreateTable
CREATE TABLE "saeb_descriptors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saeb_descriptors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ExamType" NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "gradeLevel" TEXT,
    "duration" INTEGER,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passingScore" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,
    "subjectId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_assignments" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "examId" TEXT NOT NULL,
    "classId" TEXT,
    "studentId" TEXT,

    CONSTRAINT "exam_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "proficiency" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answers" (
    "id" TEXT NOT NULL,
    "selectedOption" INTEGER,
    "isCorrect" BOOLEAN,
    "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptId" TEXT NOT NULL,
    "examQuestionId" TEXT NOT NULL,

    CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saeb_descriptors_code_key" ON "saeb_descriptors"("code");

-- CreateIndex
CREATE INDEX "saeb_descriptors_subject_idx" ON "saeb_descriptors"("subject");

-- CreateIndex
CREATE INDEX "saeb_descriptors_gradeLevel_idx" ON "saeb_descriptors"("gradeLevel");

-- CreateIndex
CREATE INDEX "exams_institutionId_idx" ON "exams"("institutionId");

-- CreateIndex
CREATE INDEX "exams_subjectId_idx" ON "exams"("subjectId");

-- CreateIndex
CREATE INDEX "exams_createdById_idx" ON "exams"("createdById");

-- CreateIndex
CREATE INDEX "exams_type_idx" ON "exams"("type");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "exam_questions_examId_idx" ON "exam_questions"("examId");

-- CreateIndex
CREATE INDEX "exam_questions_questionId_idx" ON "exam_questions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_examId_questionId_key" ON "exam_questions"("examId", "questionId");

-- CreateIndex
CREATE INDEX "exam_assignments_examId_idx" ON "exam_assignments"("examId");

-- CreateIndex
CREATE INDEX "exam_assignments_classId_idx" ON "exam_assignments"("classId");

-- CreateIndex
CREATE INDEX "exam_assignments_studentId_idx" ON "exam_assignments"("studentId");

-- CreateIndex
CREATE INDEX "exam_attempts_examId_idx" ON "exam_attempts"("examId");

-- CreateIndex
CREATE INDEX "exam_attempts_studentId_idx" ON "exam_attempts"("studentId");

-- CreateIndex
CREATE INDEX "exam_attempts_status_idx" ON "exam_attempts"("status");

-- CreateIndex
CREATE INDEX "exam_answers_attemptId_idx" ON "exam_answers"("attemptId");

-- CreateIndex
CREATE INDEX "exam_answers_examQuestionId_idx" ON "exam_answers"("examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answers_attemptId_examQuestionId_key" ON "exam_answers"("attemptId", "examQuestionId");

-- CreateIndex
CREATE INDEX "questions_saebDescriptorId_idx" ON "questions"("saebDescriptorId");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_saebDescriptorId_fkey" FOREIGN KEY ("saebDescriptorId") REFERENCES "saeb_descriptors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
