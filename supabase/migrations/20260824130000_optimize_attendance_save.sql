BEGIN;

-- As funções de identidade eram executadas dentro das políticas RLS como
-- invoker. Quando o PostgREST inseria uma frequência e retornava os
-- relacionamentos de aluno/professor, isso fazia a política de users chamar
-- novamente outras políticas e podia entrar em uma cadeia muito lenta.
-- Os helpers abaixo continuam usando exclusivamente auth.uid(), mas leem o
-- grafo de autorização sem reentrar nas políticas das tabelas protegidas.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_institution_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u."institutionId"
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS "UserRole"
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role()::text = 'SUPER_ADMIN_GLOBAL'
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role()::text = ANY (
    ARRAY[
      'SUPER_ADMIN_GLOBAL',
      'SUPER_ADMIN',
      'DIRECTOR',
      'INSTITUTION_ADMIN',
      'COORDINATOR'
    ]
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role()::text = ANY (
    ARRAY[
      'SUPER_ADMIN_GLOBAL',
      'SUPER_ADMIN',
      'DIRECTOR',
      'INSTITUTION_ADMIN',
      'COORDINATOR',
      'TEACHER'
    ]
  )
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t.id
  FROM public.users u
  JOIN public.teachers t ON t."userId" = u.id
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id
  FROM public.users u
  JOIN public.students s ON s."userId" = u.id
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_parent_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id
  FROM public.users u
  JOIN public.parents p ON p."userId" = u.id
  WHERE u.auth_user_id = auth.uid()
     OR u.id = auth.uid()::text
  ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_access_institution(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH caller AS (
    SELECT u.id, u.role, u."institutionId"
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
       OR u.id = auth.uid()::text
    ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
    LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    WHERE caller.role::text = 'SUPER_ADMIN_GLOBAL'
       OR (
         inst_id IS NOT NULL
         AND (
           caller."institutionId" = inst_id
           OR EXISTS (
             SELECT 1
             FROM public.user_institutions link
             WHERE link."userId" = caller.id
               AND link."institutionId" = inst_id
               AND link."isActive" = true
           )
         )
       )
  )
$$;

-- Esta função concentra a autorização do lançamento em uma única leitura
-- privilegiada e controlada. Ela não concede acesso por si só: exige usuário
-- autenticado, papel permitido, turma/disciplina coerentes e aluno da mesma
-- instituição.
CREATE OR REPLACE FUNCTION public.can_write_attendance(
  target_class_id text,
  target_class_subject_id text,
  target_teacher_id text,
  target_student_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH caller AS (
    SELECT u.id, u.role, u."institutionId"
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
       OR u.id = auth.uid()::text
    ORDER BY CASE WHEN u.auth_user_id = auth.uid() THEN 0 ELSE 1 END
    LIMIT 1
  ), target AS (
    SELECT c.id, c."institutionId"
    FROM public.classes c
    JOIN public.class_subjects cs
      ON cs.id = target_class_subject_id
     AND cs."classId" = c.id
    JOIN public.students s
      ON s.id = target_student_id
    JOIN public.users student_user
      ON student_user.id = s."userId"
     AND student_user."institutionId" = c."institutionId"
    WHERE c.id = target_class_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM caller
    JOIN target ON true
    WHERE caller.role::text = ANY (
      ARRAY[
        'SUPER_ADMIN_GLOBAL',
        'SUPER_ADMIN',
        'DIRECTOR',
        'INSTITUTION_ADMIN',
        'COORDINATOR',
        'TEACHER'
      ]
    )
    AND (
      caller.role::text = 'SUPER_ADMIN_GLOBAL'
      OR target."institutionId" = caller."institutionId"
      OR EXISTS (
        SELECT 1
        FROM public.user_institutions link
        WHERE link."userId" = caller.id
          AND link."institutionId" = target."institutionId"
          AND link."isActive" = true
      )
    )
    AND (
      caller.role::text <> 'TEACHER'
      OR EXISTS (
        SELECT 1
        FROM public.teachers teacher
        WHERE teacher.id = target_teacher_id
          AND teacher."userId" = caller.id
      )
    )
  )
$$;

REVOKE ALL ON FUNCTION public.can_write_attendance(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_write_attendance(text, text, text, text) TO authenticated;

-- A política antiga attendances_write chamava helpers invoker dentro de
-- consultas protegidas por users. Substituímos por políticas separadas para
-- evitar reavaliações recursivas e manter INSERT/UPDATE/DELETE explícitos.
DROP POLICY IF EXISTS attendances_write ON public.attendances;
DROP POLICY IF EXISTS attendances_insert ON public.attendances;
DROP POLICY IF EXISTS attendances_update ON public.attendances;
DROP POLICY IF EXISTS attendances_delete ON public.attendances;

CREATE POLICY attendances_insert
ON public.attendances
FOR INSERT TO authenticated
WITH CHECK (
  public.can_write_attendance(
    "classId",
    "classSubjectId",
    "teacherId",
    "studentId"
  )
);

CREATE POLICY attendances_update
ON public.attendances
FOR UPDATE TO authenticated
USING (
  public.can_write_attendance(
    "classId",
    "classSubjectId",
    "teacherId",
    "studentId"
  )
)
WITH CHECK (
  public.can_write_attendance(
    "classId",
    "classSubjectId",
    "teacherId",
    "studentId"
  )
);

CREATE POLICY attendances_delete
ON public.attendances
FOR DELETE TO authenticated
USING (
  public.can_write_attendance(
    "classId",
    "classSubjectId",
    "teacherId",
    "studentId"
  )
);

COMMIT;
