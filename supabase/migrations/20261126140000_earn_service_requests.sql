-- Buyer-to-seller service enquiries for TrendPulse Earn.
-- Requests create a private conversation and are visible only to the buyer and seller.
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.earn_services(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  request_message text not null check (char_length(btrim(request_message)) between 5 and 1500),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create index if not exists service_requests_buyer_created_idx on public.service_requests(buyer_id, created_at desc);
create index if not exists service_requests_seller_created_idx on public.service_requests(seller_id, created_at desc);
create index if not exists service_requests_conversation_idx on public.service_requests(conversation_id);

alter table public.service_requests enable row level security;
drop policy if exists "Buyers and sellers can read their service requests" on public.service_requests;
create policy "Buyers and sellers can read their service requests"
  on public.service_requests for select to authenticated
  using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);
revoke all on public.service_requests from anon, authenticated;
grant select on public.service_requests to authenticated;

-- Keep privileged database routines outside exposed API schemas.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.create_service_request(service_uuid uuid, request_text text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_service public.earn_services%rowtype;
  new_conversation uuid;
  new_request uuid;
  clean_message text := btrim(coalesce(request_text, ''));
begin
  if actor is null then raise exception 'Sign in to contact this seller.'; end if;
  if char_length(clean_message) < 5 or char_length(clean_message) > 1500 then
    raise exception 'Please write between 5 and 1500 characters.';
  end if;
  select * into target_service from public.earn_services
    where id = service_uuid and status = 'active';
  if not found then raise exception 'This service is no longer available.'; end if;
  if target_service.seller_id = actor then raise exception 'You cannot request your own service.'; end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = actor and blocked_id = target_service.seller_id)
       or (blocker_id = target_service.seller_id and blocked_id = actor)
  ) then raise exception 'This member cannot be contacted.'; end if;

  insert into public.conversations(created_by) values (actor) returning id into new_conversation;
  insert into public.conversation_members(conversation_id,user_id)
    values (new_conversation,actor),(new_conversation,target_service.seller_id);
  insert into public.messages(conversation_id,sender_id,body)
    values (new_conversation,actor,'Service request: ' || target_service.title || E'\n\n' || clean_message);
  insert into public.service_requests(service_id,buyer_id,seller_id,conversation_id,request_message)
    values (target_service.id,actor,target_service.seller_id,new_conversation,clean_message)
    returning id into new_request;
  insert into public.notifications(user_id,kind,title,body,target_url)
    values (target_service.seller_id,'service_request','New service request',
      'Someone has sent a request for ' || target_service.title || '.',
      './earn.html?request=' || new_request::text);
  return new_request;
end;
$$;
revoke all on function private.create_service_request(uuid,text) from public, anon;
grant execute on function private.create_service_request(uuid,text) to authenticated;

create or replace function public.create_service_request(service_uuid uuid, request_text text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.create_service_request(service_uuid, request_text); $$;
revoke all on function public.create_service_request(uuid,text) from public, anon;
grant execute on function public.create_service_request(uuid,text) to authenticated;

create or replace function private.respond_service_request(request_uuid uuid, next_status text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_request public.service_requests%rowtype;
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
  update public.service_requests set status = next_status, updated_at = now() where id = request_uuid;
  select title into target_title from public.earn_services where id = target_request.service_id;
  insert into public.notifications(user_id,kind,title,body,target_url)
    values (
      case when actor = target_request.seller_id then target_request.buyer_id else target_request.seller_id end,
      'service_request_update','Service request ' || next_status,
      coalesce(target_title,'A service') || ' request was ' || next_status || '.',
      './messages.html?conversation=' || target_request.conversation_id::text
    );
  return target_request.conversation_id;
end;
$$;
revoke all on function private.respond_service_request(uuid,text) from public, anon;
grant execute on function private.respond_service_request(uuid,text) to authenticated;

create or replace function public.respond_service_request(request_uuid uuid, next_status text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.respond_service_request(request_uuid, next_status); $$;
revoke all on function public.respond_service_request(uuid,text) from public, anon;
grant execute on function public.respond_service_request(uuid,text) to authenticated;
