-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'APPROVED', 'FAILED', 'DROPPED_OUT', 'TRANSFERRED');

-- AlterTable
ALTER TABLE "class_enrollments" ADD COLUMN     "finalGrade" DOUBLE PRECISION,
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED';
