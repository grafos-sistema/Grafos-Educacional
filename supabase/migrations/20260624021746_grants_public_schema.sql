REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.institutions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_profile(text, "UserRole", text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_profile(text, "UserRole", text, text, text, text, text) TO authenticated;
