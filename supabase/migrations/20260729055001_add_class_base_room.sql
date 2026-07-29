ALTER TABLE "public"."classes"
ADD COLUMN IF NOT EXISTS "baseRoom" TEXT;

COMMENT ON COLUMN "public"."classes"."baseRoom"
IS 'Sala base da turma';

COMMENT ON COLUMN "public"."class_schedules"."room"
IS 'Local alternativo da aula, usado apenas quando difere da sala base da turma';
