ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS "targetStudentIds" text[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS "targetParentIds" text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.announcements
SET "targetRoles" = '{}'::text[]
WHERE "targetRoles" IS NULL;

ALTER TABLE public.announcements
ALTER COLUMN "targetRoles" SET DEFAULT '{}'::text[],
ALTER COLUMN "targetRoles" SET NOT NULL;
