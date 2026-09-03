BEGIN;

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS weight double precision NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'evaluations_weight_check'
  ) THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT evaluations_weight_check
      CHECK (weight >= 0 AND weight <= 100);
  END IF;
END $$;

COMMIT;
