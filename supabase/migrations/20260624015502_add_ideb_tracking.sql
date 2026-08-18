-- CreateTable
CREATE TABLE "ideb_targets" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "nationalTarget" DOUBLE PRECISION,
    "stateTarget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "ideb_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideb_indicators" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "approvalRate" DOUBLE PRECISION NOT NULL,
    "dropoutRate" DOUBLE PRECISION NOT NULL,
    "repetitionRate" DOUBLE PRECISION NOT NULL,
    "averageProficiency" DOUBLE PRECISION NOT NULL,
    "mathProficiency" DOUBLE PRECISION,
    "portugueseProficiency" DOUBLE PRECISION,
    "idebScore" DOUBLE PRECISION NOT NULL,
    "totalStudents" INTEGER NOT NULL,
    "evaluatedStudents" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "ideb_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ideb_targets_institutionId_idx" ON "ideb_targets"("institutionId");

-- CreateIndex
CREATE INDEX "ideb_targets_year_idx" ON "ideb_targets"("year");

-- CreateIndex
CREATE UNIQUE INDEX "ideb_targets_institutionId_year_gradeLevel_key" ON "ideb_targets"("institutionId", "year", "gradeLevel");

-- CreateIndex
CREATE INDEX "ideb_indicators_institutionId_idx" ON "ideb_indicators"("institutionId");

-- CreateIndex
CREATE INDEX "ideb_indicators_year_idx" ON "ideb_indicators"("year");

-- CreateIndex
CREATE UNIQUE INDEX "ideb_indicators_institutionId_year_gradeLevel_key" ON "ideb_indicators"("institutionId", "year", "gradeLevel");

-- AddForeignKey
ALTER TABLE "ideb_targets" ADD CONSTRAINT "ideb_targets_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideb_indicators" ADD CONSTRAINT "ideb_indicators_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
