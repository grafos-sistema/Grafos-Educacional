alter table public.institutions
add column if not exists website text;

create table if not exists public.institution_units (
  id text primary key,
  name text not null,
  code text,
  slug text,
  type text,
  "managerName" text,
  address text,
  numero text,
  complemento text,
  city text,
  state text,
  "zipCode" text,
  phone text,
  email text,
  website text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "institutionId" text not null references public.institutions(id) on delete cascade
);

create index if not exists institution_units_institution_id_idx
  on public.institution_units ("institutionId");

alter table public.institution_units
add column if not exists "managerName" text,
add column if not exists numero text,
add column if not exists complemento text,
add column if not exists website text;
