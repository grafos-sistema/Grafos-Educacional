ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN_GLOBAL';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTOR';

CREATE TABLE IF NOT EXISTS "institution_units" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  "institutionId" TEXT NOT NULL REFERENCES "institutions"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "slug" TEXT,
  "type" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "institution_units_institutionId_code_key" UNIQUE ("institutionId", "code"),
  CONSTRAINT "institution_units_institutionId_slug_key" UNIQUE ("institutionId", "slug")
);

CREATE INDEX IF NOT EXISTS "institution_units_institutionId_idx" ON "institution_units"("institutionId");

CREATE TABLE IF NOT EXISTS "institution_documents" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  "institutionId" TEXT NOT NULL REFERENCES "institutions"("id") ON DELETE CASCADE,
  "unitId" TEXT REFERENCES "institution_units"("id") ON DELETE SET NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileName" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "institution_documents_institutionId_idx" ON "institution_documents"("institutionId");
CREATE INDEX IF NOT EXISTS "institution_documents_unitId_idx" ON "institution_documents"("unitId");
CREATE INDEX IF NOT EXISTS "institution_documents_type_idx" ON "institution_documents"("type");

CREATE TABLE IF NOT EXISTS "user_units" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "unitId" TEXT NOT NULL REFERENCES "institution_units"("id") ON DELETE CASCADE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_units_userId_unitId_key" UNIQUE ("userId", "unitId")
);

CREATE INDEX IF NOT EXISTS "user_units_userId_idx" ON "user_units"("userId");
CREATE INDEX IF NOT EXISTS "user_units_unitId_idx" ON "user_units"("unitId");

CREATE OR REPLACE FUNCTION update_institution_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_institution_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_user_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_institution_units_updated_at ON "institution_units";
CREATE TRIGGER trigger_update_institution_units_updated_at
  BEFORE UPDATE ON "institution_units"
  FOR EACH ROW
  EXECUTE FUNCTION update_institution_units_updated_at();

DROP TRIGGER IF EXISTS trigger_update_institution_documents_updated_at ON "institution_documents";
CREATE TRIGGER trigger_update_institution_documents_updated_at
  BEFORE UPDATE ON "institution_documents"
  FOR EACH ROW
  EXECUTE FUNCTION update_institution_documents_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_units_updated_at ON "user_units";
CREATE TRIGGER trigger_update_user_units_updated_at
  BEFORE UPDATE ON "user_units"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_units_updated_at();
