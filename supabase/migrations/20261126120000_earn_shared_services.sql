-- Shared TrendPulse Earn marketplace services.
-- Public users can browse active listings; only the authenticated owner can manage their own.
create table if not exists public.earn_services (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 70),
  category text not null check (category in ('Video editing','Graphic design','Writing','Photography','Tutoring','Other')),
  description text not null check (char_length(btrim(description)) between 1 and 400),
  starting_price numeric(12,2) not null check (starting_price >= 0 and starting_price <= 100000000),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists earn_services_active_created_idx
  on public.earn_services(status, created_at desc);
create index if not exists earn_services_seller_created_idx
  on public.earn_services(seller_id, created_at desc);

alter table public.earn_services enable row level security;

drop policy if exists "Anyone can browse active earn services" on public.earn_services;
create policy "Anyone can browse active earn services"
  on public.earn_services for select
  to anon, authenticated
  using (status = 'active' or (select auth.uid()) = seller_id);

drop policy if exists "Members can publish their own earn services" on public.earn_services;
create policy "Members can publish their own earn services"
  on public.earn_services for insert
  to authenticated
  with check ((select auth.uid()) = seller_id);

drop policy if exists "Members can update their own earn services" on public.earn_services;
create policy "Members can update their own earn services"
  on public.earn_services for update
  to authenticated
  using ((select auth.uid()) = seller_id)
  with check ((select auth.uid()) = seller_id);

drop policy if exists "Members can delete their own earn services" on public.earn_services;
create policy "Members can delete their own earn services"
  on public.earn_services for delete
  to authenticated
  using ((select auth.uid()) = seller_id);

-- Explicit grants are required because new tables are not automatically exposed
-- through the Data API in current Supabase projects.
grant select on public.earn_services to anon, authenticated;
grant insert, update, delete on public.earn_services to authenticated;
