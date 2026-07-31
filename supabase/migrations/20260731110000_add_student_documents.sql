ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS student_documents_bucket_select ON storage.objects;
CREATE POLICY student_documents_bucket_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (
    public.is_admin()
    OR public.current_student_id() = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS student_documents_bucket_insert ON storage.objects;
CREATE POLICY student_documents_bucket_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents'
  AND public.is_admin()
);

DROP POLICY IF EXISTS student_documents_bucket_update ON storage.objects;
CREATE POLICY student_documents_bucket_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'student-documents'
  AND public.is_admin()
);

DROP POLICY IF EXISTS student_documents_bucket_delete ON storage.objects;
CREATE POLICY student_documents_bucket_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND public.is_admin()
);
