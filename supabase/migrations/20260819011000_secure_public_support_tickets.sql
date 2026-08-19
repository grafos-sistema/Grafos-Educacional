BEGIN;

DROP POLICY IF EXISTS support_tickets_public_insert ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_bucket_public_insert ON storage.objects;

REVOKE INSERT ON public.support_tickets FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS private.support_ticket_rate_limits (
  key_hash text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0)
);

CREATE INDEX IF NOT EXISTS support_ticket_rate_limits_window_idx
  ON private.support_ticket_rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.claim_support_ticket_rate_limit(
  p_key_hash text,
  p_window_seconds integer DEFAULT 900,
  p_limit integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_window_seconds integer := LEAST(GREATEST(p_window_seconds, 60), 86400);
  v_limit integer := LEAST(GREATEST(p_limit, 1), 100);
  v_count integer;
BEGIN
  IF p_key_hash IS NULL OR length(p_key_hash) < 16 THEN
    RETURN false;
  END IF;

  DELETE FROM private.support_ticket_rate_limits
  WHERE window_start < now() - interval '2 days';

  INSERT INTO private.support_ticket_rate_limits AS limits (
    key_hash,
    window_start,
    request_count
  )
  VALUES (p_key_hash, now(), 1)
  ON CONFLICT (key_hash) DO UPDATE
  SET
    window_start = CASE
      WHEN limits.window_start <= now() - make_interval(secs => v_window_seconds)
        THEN now()
      ELSE limits.window_start
    END,
    request_count = CASE
      WHEN limits.window_start <= now() - make_interval(secs => v_window_seconds)
        THEN 1
      ELSE limits.request_count + 1
    END
  RETURNING request_count INTO v_count;

  RETURN v_count <= v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_support_ticket_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_support_ticket_rate_limit(text, integer, integer)
  TO service_role;

COMMIT;
