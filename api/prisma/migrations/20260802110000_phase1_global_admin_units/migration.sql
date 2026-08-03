ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN_GLOBAL';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTOR';

CREATE TABLE "institution_units" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "institution_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "institution_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "institution_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_units" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "user_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "institution_units_institutionId_code_key" ON "institution_units"("institutionId", "code");
CREATE UNIQUE INDEX "institution_units_institutionId_slug_key" ON "institution_units"("institutionId", "slug");
CREATE INDEX "institution_units_institutionId_idx" ON "institution_units"("institutionId");

CREATE INDEX "institution_documents_institutionId_idx" ON "institution_documents"("institutionId");
CREATE INDEX "institution_documents_unitId_idx" ON "institution_documents"("unitId");
CREATE INDEX "institution_documents_type_idx" ON "institution_documents"("type");

CREATE UNIQUE INDEX "user_units_userId_unitId_key" ON "user_units"("userId", "unitId");
CREATE INDEX "user_units_userId_idx" ON "user_units"("userId");
CREATE INDEX "user_units_unitId_idx" ON "user_units"("unitId");

ALTER TABLE "institution_units" ADD CONSTRAINT "institution_units_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "institution_documents" ADD CONSTRAINT "institution_documents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "institution_documents" ADD CONSTRAINT "institution_documents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "institution_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_units" ADD CONSTRAINT "user_units_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_units" ADD CONSTRAINT "user_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "institution_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
