UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'event-attachments';
