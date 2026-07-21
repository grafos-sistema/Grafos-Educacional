drop index if exists public."academic_periods_academicYearId_orderNumber_key";

create unique index "academic_periods_academicYearId_orderNumber_active_key"
on public."academic_periods" ("academicYearId", "orderNumber")
where "isActive" = true;
