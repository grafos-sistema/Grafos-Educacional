-- WhatsApp is a separate contact channel from the main phone number.
-- Keep this idempotent for projects where the column was created manually.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS "whatsapp" text;
