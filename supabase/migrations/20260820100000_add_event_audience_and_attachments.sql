ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS "locationType" TEXT NOT NULL DEFAULT 'SCHOOL',
  ADD COLUMN IF NOT EXISTS "isGeneral" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "audienceRoles" JSONB NOT NULL DEFAULT '["STUDENTS","PARENTS","TEACHERS","COLLABORATORS"]'::jsonb,
  ADD COLUMN IF NOT EXISTS "courseIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "classIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "requiresRsvp" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-attachments',
  'event-attachments',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS event_attachments_select ON storage.objects;
CREATE POLICY event_attachments_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-attachments'
  AND public.can_access_institution((storage.foldername(name))[1])
);

DROP POLICY IF EXISTS event_attachments_insert ON storage.objects;
CREATE POLICY event_attachments_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-attachments'
  AND public.current_role() IN (
    'SUPER_ADMIN'::"UserRole",
    'INSTITUTION_ADMIN'::"UserRole",
    'DIRECTOR'::"UserRole",
    'COORDINATOR'::"UserRole"
  )
  AND public.can_access_institution((storage.foldername(name))[1])
);

DROP POLICY IF EXISTS event_attachments_update ON storage.objects;
CREATE POLICY event_attachments_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-attachments'
  AND public.current_role() IN (
    'SUPER_ADMIN'::"UserRole",
    'INSTITUTION_ADMIN'::"UserRole",
    'DIRECTOR'::"UserRole",
    'COORDINATOR'::"UserRole"
  )
  AND public.can_access_institution((storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'event-attachments'
  AND public.current_role() IN (
    'SUPER_ADMIN'::"UserRole",
    'INSTITUTION_ADMIN'::"UserRole",
    'DIRECTOR'::"UserRole",
    'COORDINATOR'::"UserRole"
  )
  AND public.can_access_institution((storage.foldername(name))[1])
);

DROP POLICY IF EXISTS event_attachments_delete ON storage.objects;
CREATE POLICY event_attachments_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-attachments'
  AND public.current_role() IN (
    'SUPER_ADMIN'::"UserRole",
    'INSTITUTION_ADMIN'::"UserRole",
    'DIRECTOR'::"UserRole",
    'COORDINATOR'::"UserRole"
  )
  AND public.can_access_institution((storage.foldername(name))[1])
);
