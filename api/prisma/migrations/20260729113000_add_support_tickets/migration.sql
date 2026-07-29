CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" TEXT PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "name" TEXT NOT NULL,
  "cpf" TEXT,
  "phone" TEXT,
  "email" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requesterRole" TEXT,
  "source" TEXT,
  "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" TEXT,
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_tickets_resolvedByUserId_fkey"
    FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "support_tickets_status_idx"
  ON "support_tickets" ("status");

CREATE INDEX IF NOT EXISTS "support_tickets_created_at_idx"
  ON "support_tickets" ("createdAt" DESC);
