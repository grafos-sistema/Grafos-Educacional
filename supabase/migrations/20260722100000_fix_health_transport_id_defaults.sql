CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "public"."student_health_records"
  ALTER COLUMN "id" SET DEFAULT (gen_random_uuid()::text),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."student_transportation"
  ALTER COLUMN "id" SET DEFAULT (gen_random_uuid()::text),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
