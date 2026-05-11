-- Supabase hardening:
-- The app accesses data server-side through Prisma, not directly through
-- Supabase's browser Data API. Enable RLS and remove default API grants so
-- public tables are not exposed via anon/authenticated/service_role roles.

alter table public."User" enable row level security;
alter table public."Account" enable row level security;
alter table public."CreditAccount" enable row level security;
alter table public."CreditCardCycle" enable row level security;
alter table public."IncomeEvent" enable row level security;
alter table public."Allocation" enable row level security;
alter table public."Transaction" enable row level security;
alter table public."Category" enable row level security;
alter table public."Budget" enable row level security;
alter table public."Goal" enable row level security;
alter table public."InstallmentPlan" enable row level security;
alter table public."ImportBatch" enable row level security;
alter table public."ImportItem" enable row level security;

revoke all on table public."User" from anon, authenticated, service_role;
revoke all on table public."Account" from anon, authenticated, service_role;
revoke all on table public."CreditAccount" from anon, authenticated, service_role;
revoke all on table public."CreditCardCycle" from anon, authenticated, service_role;
revoke all on table public."IncomeEvent" from anon, authenticated, service_role;
revoke all on table public."Allocation" from anon, authenticated, service_role;
revoke all on table public."Transaction" from anon, authenticated, service_role;
revoke all on table public."Category" from anon, authenticated, service_role;
revoke all on table public."Budget" from anon, authenticated, service_role;
revoke all on table public."Goal" from anon, authenticated, service_role;
revoke all on table public."InstallmentPlan" from anon, authenticated, service_role;
revoke all on table public."ImportBatch" from anon, authenticated, service_role;
revoke all on table public."ImportItem" from anon, authenticated, service_role;

revoke usage, select on all sequences in schema public from anon, authenticated, service_role;
revoke execute on all functions in schema public from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
