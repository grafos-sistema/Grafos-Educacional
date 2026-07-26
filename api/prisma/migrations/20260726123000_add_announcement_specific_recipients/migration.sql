ALTER TABLE "announcements"
ADD COLUMN IF NOT EXISTS "targetStudentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "announcements"
ADD COLUMN IF NOT EXISTS "targetParentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "announcements_targetStudentIds_idx"
ON "announcements"
USING GIN ("targetStudentIds");

CREATE INDEX IF NOT EXISTS "announcements_targetParentIds_idx"
ON "announcements"
USING GIN ("targetParentIds");
