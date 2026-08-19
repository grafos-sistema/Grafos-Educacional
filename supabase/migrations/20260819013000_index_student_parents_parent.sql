-- Supports guardian-scoped RLS checks without scanning every student-parent link.
CREATE INDEX IF NOT EXISTS student_parents_parent_id_idx
  ON public.student_parents ("parentId");
