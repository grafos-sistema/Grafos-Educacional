alter table public.institution_units
add column if not exists "directorUserId" text references public.users(id) on delete set null;

create index if not exists institution_units_director_user_id_idx
  on public.institution_units ("directorUserId");
