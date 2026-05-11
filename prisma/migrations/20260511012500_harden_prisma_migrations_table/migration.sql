-- Supabase Table Editor can show Prisma's internal migration table as
-- unrestricted. This table is not part of the app domain, but it should not
-- be readable through the Data API either.
do $$
begin
  if to_regclass('public._prisma_migrations') is not null then
    alter table public."_prisma_migrations" enable row level security;
    revoke all on table public."_prisma_migrations" from anon, authenticated, service_role;
  end if;
end $$;
