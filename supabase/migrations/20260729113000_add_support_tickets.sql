CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  name text NOT NULL,
  cpf text,
  phone text,
  email text NOT NULL,
  description text NOT NULL,
  "requesterRole" text,
  source text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  "resolvedAt" timestamptz,
  "resolvedByUserId" text REFERENCES public.users(id) ON DELETE SET NULL,
  "resolutionNotes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets (status);

CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx
  ON public.support_tickets ("createdAt" DESC);

CREATE OR REPLACE FUNCTION private.set_support_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_support_ticket_updated_at ON public.support_tickets;

CREATE TRIGGER set_support_ticket_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION private.set_support_ticket_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_super_admin_select ON public.support_tickets;
CREATE POLICY support_tickets_super_admin_select
ON public.support_tickets
FOR SELECT
TO authenticated
USING (public.current_role() = 'SUPER_ADMIN'::"UserRole");

DROP POLICY IF EXISTS support_tickets_public_insert ON public.support_tickets;
CREATE POLICY support_tickets_public_insert
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS support_tickets_super_admin_update ON public.support_tickets;
CREATE POLICY support_tickets_super_admin_update
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (public.current_role() = 'SUPER_ADMIN'::"UserRole")
WITH CHECK (public.current_role() = 'SUPER_ADMIN'::"UserRole");

GRANT INSERT ON public.support_tickets TO anon, authenticated;
GRANT SELECT, UPDATE ON public.support_tickets TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-tickets',
  'support-tickets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS support_tickets_bucket_super_admin_select ON storage.objects;
CREATE POLICY support_tickets_bucket_super_admin_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-tickets'
  AND public.current_role() = 'SUPER_ADMIN'::"UserRole"
);

DROP POLICY IF EXISTS support_tickets_bucket_public_insert ON storage.objects;
CREATE POLICY support_tickets_bucket_public_insert
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'support-tickets'
);
