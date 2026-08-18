-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- DropIndex
DROP INDEX IF EXISTS "users_cpf_key";

-- CreateIndex
CREATE UNIQUE INDEX "unique_email_per_institution" ON "users"("email", "institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_cpf_per_institution" ON "users"("cpf", "institutionId");
