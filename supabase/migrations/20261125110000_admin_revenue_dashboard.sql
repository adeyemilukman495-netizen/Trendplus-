-- TrendPulse owner dashboard: secure admin allowlist, revenue ledger and service point balances.
-- Admin access is granted only by inserting an auth user into public.trendpulse_admins.
-- Never expose a Supabase service-role key in browser code.

create table if not exists public.trendpulse_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income','expense')),
  source text not null check (source in ('ads','tools','points','other')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency in ('NGN','USD','GBP','EUR')),
  note text not null default '',
  entry_date date not null default current_date,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.admin_services (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  website_url text not null default '',
  points_remaining numeric(14,2) not null default 0 check (points_remaining >= 0),
  low_points_at numeric(14,2) not null default 100 check (low_points_at >= 0),
  topup_cost numeric(14,2) not null default 0 check (topup_cost >= 0),
  currency text not null default 'NGN' check (currency in ('NGN','USD','GBP','EUR')),
  notes text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create or replace function public.is_trendpulse_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trendpulse_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_trendpulse_admin() from public;
grant execute on function public.is_trendpulse_admin() to authenticated;

alter table public.trendpulse_admins enable row level security;
alter table public.admin_finance_entries enable row level security;
alter table public.admin_services enable row level security;

drop policy if exists "TrendPulse admins can read admin list" on public.trendpulse_admins;
create policy "TrendPulse admins can read admin list" on public.trendpulse_admins
 for select to authenticated using (public.is_trendpulse_admin());

drop policy if exists "TrendPulse admins manage finance entries" on public.admin_finance_entries;
create policy "TrendPulse admins manage finance entries" on public.admin_finance_entries
 for all to authenticated using (public.is_trendpulse_admin())
 with check (public.is_trendpulse_admin() and created_by = (select auth.uid()));

drop policy if exists "TrendPulse admins manage services" on public.admin_services;
create policy "TrendPulse admins manage services" on public.admin_services
 for all to authenticated using (public.is_trendpulse_admin())
 with check (public.is_trendpulse_admin());

grant select, insert, update, delete on public.trendpulse_admins to authenticated;
grant select, insert, update, delete on public.admin_finance_entries to authenticated;
grant select, insert, update, delete on public.admin_services to authenticated;

create index if not exists admin_finance_entries_date_idx on public.admin_finance_entries(entry_date desc);
create index if not exists admin_services_name_idx on public.admin_services(service_name);

-- OWNER SETUP (run separately after this migration):
-- Replace the email below with the exact email used for your TrendPulse account.
-- insert into public.trendpulse_admins(user_id)
-- select id from auth.users where lower(email) = lower('YOUR_LOGIN_EMAIL')
-- on conflict (user_id) do nothing;
