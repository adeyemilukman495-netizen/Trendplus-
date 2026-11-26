-- TrendPulse payment sandbox foundation.
-- This migration records TEST-ONLY payments. It does not connect Paystack,
-- collect real money, hold customer funds, or send seller payouts.
-- Live payment processing must be added only after the business and settlement
-- arrangements are approved by the payment provider.

create table if not exists public.service_test_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'test_succeeded' check (status = 'test_succeeded'),
  mode text not null default 'sandbox' check (mode = 'sandbox'),
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create unique index if not exists service_test_payments_one_success_per_order
  on public.service_test_payments(order_id);
create index if not exists service_test_payments_buyer_created_idx
  on public.service_test_payments(buyer_id, created_at desc);
create index if not exists service_test_payments_seller_created_idx
  on public.service_test_payments(seller_id, created_at desc);

-- Append-only test ledger. It is deliberately labelled as simulated activity.
create table if not exists public.service_test_ledger (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.service_test_payments(id) on delete restrict,
  order_id uuid not null references public.service_orders(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  entry_type text not null default 'test_sale_credit' check (entry_type = 'test_sale_credit'),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  created_at timestamptz not null default now()
);
create index if not exists service_test_ledger_seller_created_idx
  on public.service_test_ledger(seller_id, created_at desc);

alter table public.service_test_payments enable row level security;
alter table public.service_test_ledger enable row level security;

drop policy if exists "Order participants can read test payments" on public.service_test_payments;
create policy "Order participants can read test payments"
  on public.service_test_payments for select to authenticated
  using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);

drop policy if exists "Sellers can read their test ledger" on public.service_test_ledger;
create policy "Sellers can read their test ledger"
  on public.service_test_ledger for select to authenticated
  using ((select auth.uid()) = seller_id);

revoke all on public.service_test_payments, public.service_test_ledger from public, anon, authenticated;
grant select on public.service_test_payments, public.service_test_ledger to authenticated;

-- This RPC is intentionally a simulation. It cannot call a payment provider.
-- The database checks the buyer, order amount and duplicate-payment condition.
create or replace function public.simulate_service_test_payment(order_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.service_orders%rowtype;
  new_payment uuid;
begin
  if actor is null then
    raise exception 'Sign in required.';
  end if;

  select * into target
    from public.service_orders
    where id = order_uuid
    for update;

  if not found then
    raise exception 'Order not found.';
  end if;
  if target.buyer_id <> actor then
    raise exception 'Only the buyer can run the payment simulation.';
  end if;
  if target.status not in ('accepted','in_progress','delivered') then
    raise exception 'This order is not eligible for the payment simulation.';
  end if;
  if target.listing_price <= 0 then
    raise exception 'A positive order amount is required.';
  end if;
  if exists (
    select 1 from public.service_test_payments p where p.order_id = order_uuid
  ) then
    raise exception 'A test payment has already been recorded for this order.';
  end if;

  insert into public.service_test_payments(order_id,buyer_id,seller_id,amount,currency)
    values(order_uuid,target.buyer_id,target.seller_id,target.listing_price,target.currency)
    returning id into new_payment;

  insert into public.service_test_ledger(payment_id,order_id,seller_id,amount,currency)
    values(new_payment,order_uuid,target.seller_id,target.listing_price,target.currency);

  return new_payment;
end;
$$;

revoke all on function public.simulate_service_test_payment(uuid) from public, anon;
grant execute on function public.simulate_service_test_payment(uuid) to authenticated;

comment on table public.service_test_payments is
  'TEST-ONLY payment simulation records. Not evidence of real payment or funds received.';
comment on table public.service_test_ledger is
  'TEST-ONLY seller ledger credits. These balances are simulated and cannot be withdrawn.';
