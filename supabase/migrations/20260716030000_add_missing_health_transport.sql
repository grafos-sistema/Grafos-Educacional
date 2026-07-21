-- Add missing user document fields
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "rg" TEXT,
  ADD COLUMN IF NOT EXISTS "rgEmissor" TEXT,
  ADD COLUMN IF NOT EXISTS "rgEmissao" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "socialName" TEXT,
  ADD COLUMN IF NOT EXISTS "nacionalidade" TEXT,
  ADD COLUMN IF NOT EXISTS "naturalidade" TEXT,
  ADD COLUMN IF NOT EXISTS "telefoneFixo" TEXT;

-- CreateTable student_health_records
CREATE TABLE IF NOT EXISTS "student_health_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tipoSanguineo" TEXT,
    "convenioMedico" TEXT,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "necessidadesEspeciais" TEXT,
    "restricoesAlimentares" TEXT,
    "contatoEmergencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable student_transportation
CREATE TABLE IF NOT EXISTS "student_transportation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "usaTransporte" BOOLEAN NOT NULL DEFAULT false,
    "tipoTransporte" TEXT,
    "empresaTransporte" TEXT,
    "motoristaTransporte" TEXT,
    "rotaTransporte" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_transportation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "student_health_records_studentId_key" ON "student_health_records"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "student_transportation_studentId_key" ON "student_transportation"("studentId");

-- AddForeignKey
ALTER TABLE "student_health_records" DROP CONSTRAINT IF EXISTS "student_health_records_studentId_fkey";
ALTER TABLE "student_health_records" ADD CONSTRAINT "student_health_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_transportation" DROP CONSTRAINT IF EXISTS "student_transportation_studentId_fkey";
ALTER TABLE "student_transportation" ADD CONSTRAINT "student_transportation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
