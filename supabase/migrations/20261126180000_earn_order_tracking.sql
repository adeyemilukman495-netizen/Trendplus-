-- Track accepted Earn service requests as private, auditable orders.
create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null unique references public.service_requests(id) on delete restrict,
  service_id uuid not null references public.earn_services(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  agreed_price numeric(12,2) not null check (agreed_price >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'accepted'
    check (status in ('accepted','in_progress','delivered','completed','cancelled')),
  accepted_at timestamptz not null default now(),
  started_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create index if not exists service_orders_buyer_created_idx
  on public.service_orders(buyer_id, created_at desc);
create index if not exists service_orders_seller_created_idx
  on public.service_orders(seller_id, created_at desc);

create table if not exists public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null check (event_type in ('accepted','in_progress','delivered','completed','cancelled')),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists service_order_events_order_created_idx
  on public.service_order_events(order_id, created_at asc);

alter table public.service_orders enable row level security;
alter table public.service_order_events enable row level security;
drop policy if exists "Buyers and sellers can read their orders" on public.service_orders;
create policy "Buyers and sellers can read their orders"
  on public.service_orders for select to authenticated
  using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);
drop policy if exists "Order participants can read order history" on public.service_order_events;
create policy "Order participants can read order history"
  on public.service_order_events for select to authenticated
  using (exists (
    select 1 from public.service_orders o
    where o.id = order_id
      and ((select auth.uid()) = o.buyer_id or (select auth.uid()) = o.seller_id)
  ));
revoke all on public.service_orders, public.service_order_events from anon, authenticated;
grant select on public.service_orders, public.service_order_events to authenticated;

-- Acceptance and order creation happen atomically in one transaction.
create or replace function private.respond_service_request(request_uuid uuid, next_status text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_request public.service_requests%rowtype;
  target_service public.earn_services%rowtype;
  new_order uuid;
  target_title text;
begin
  if actor is null then raise exception 'Sign in required.'; end if;
  if next_status not in ('accepted','declined','cancelled') then
    raise exception 'That request status is not allowed.';
  end if;
  select * into target_request from public.service_requests where id = request_uuid for update;
  if not found then raise exception 'Service request not found.'; end if;
  if target_request.status <> 'pending' then raise exception 'This request has already been handled.'; end if;
  if actor = target_request.seller_id and next_status in ('accepted','declined') then
    null;
  elsif actor = target_request.buyer_id and next_status = 'cancelled' then
    null;
  else
    raise exception 'You are not allowed to change this request.';
  end if;

  select * into target_service from public.earn_services where id = target_request.service_id;
  if next_status = 'accepted' then
    if not found then raise exception 'The service listing is no longer available.'; end if;
    insert into public.service_orders(
      service_request_id,service_id,buyer_id,seller_id,conversation_id,agreed_price,status
    ) values (
      target_request.id,target_request.service_id,target_request.buyer_id,target_request.seller_id,
      target_request.conversation_id,target_service.starting_price,'accepted'
    ) returning id into new_order;
    insert into public.service_order_events(order_id,actor_id,event_type,note)
      values (new_order,actor,'accepted','Seller accepted the service request.');
  end if;

  update public.service_requests set status = next_status, updated_at = now() where id = request_uuid;
  target_title := target_service.title;
  insert into public.notifications(user_id,kind,title,body,target_url)
    values (
      case when actor = target_request.seller_id then target_request.buyer_id else target_request.seller_id end,
      'service_request_update','Service request ' || next_status,
      coalesce(target_title,'A service') || ' request was ' || next_status || '.',
      case when new_order is not null then './earn.html?order=' || new_order::text
           else './messages.html?conversation=' || target_request.conversation_id::text end
    );
  return target_request.conversation_id;
end;
$$;
revoke all on function private.respond_service_request(uuid,text) from public, anon;
grant execute on function private.respond_service_request(uuid,text) to authenticated;

create or replace function private.transition_service_order(order_uuid uuid, next_status text, event_note text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_order public.service_orders%rowtype;
  clean_note text := left(btrim(coalesce(event_note,'')),1000);
  recipient uuid;
  target_title text;
begin
  if actor is null then raise exception 'Sign in required.'; end if;
  if next_status not in ('in_progress','delivered','completed','cancelled') then
    raise exception 'That order status is not allowed.';
  end if;
  select * into target_order from public.service_orders where id = order_uuid for update;
  if not found then raise exception 'Order not found.'; end if;

  if next_status = 'in_progress' and actor = target_order.seller_id and target_order.status = 'accepted' then
    update public.service_orders set status='in_progress',started_at=now(),updated_at=now() where id=order_uuid;
  elsif next_status = 'delivered' and actor = target_order.seller_id and target_order.status = 'in_progress' then
    update public.service_orders set status='delivered',delivered_at=now(),updated_at=now() where id=order_uuid;
  elsif next_status = 'completed' and actor = target_order.buyer_id and target_order.status = 'delivered' then
    update public.service_orders set status='completed',completed_at=now(),updated_at=now() where id=order_uuid;
  elsif next_status = 'cancelled' and actor in (target_order.buyer_id,target_order.seller_id) and target_order.status = 'accepted' then
    update public.service_orders set status='cancelled',cancelled_at=now(),updated_at=now() where id=order_uuid;
  else
    raise exception 'You cannot make that status change at this stage.';
  end if;

  insert into public.service_order_events(order_id,actor_id,event_type,note)
    values(order_uuid,actor,next_status,clean_note);
  recipient := case when actor = target_order.buyer_id then target_order.seller_id else target_order.buyer_id end;
  select s.title into target_title from public.earn_services s where s.id=target_order.service_id;
  insert into public.notifications(user_id,kind,title,body,target_url)
    values(recipient,'service_order_update','Order ' || replace(next_status,'_',' '),
      coalesce(target_title,'Your service order') || ' was marked ' || replace(next_status,'_',' ') || '.',
      './earn.html?order=' || order_uuid::text);
  return order_uuid;
end;
$$;
revoke all on function private.transition_service_order(uuid,text,text) from public, anon;
grant execute on function private.transition_service_order(uuid,text,text) to authenticated;

create or replace function public.transition_service_order(order_uuid uuid, next_status text, event_note text default '')
returns uuid language sql security invoker set search_path = ''
as $$ select private.transition_service_order(order_uuid,next_status,event_note); $$;
revoke all on function public.transition_service_order(uuid,text,text) from public, anon;
grant execute on function public.transition_service_order(uuid,text,text) to authenticated;
