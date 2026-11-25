-- TrendPulse notifications: create inbox events for social actions and direct messages.
-- Additive only. Notifications are visible and editable only by their recipient.
-- Trigger helpers live in a non-exposed schema and cannot be called through the public Data API.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create or replace function private.tp_notify_follow()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare actor_name text;
begin
  if new.follower_id = new.followed_id then return new; end if;
  select coalesce(p.display_name, 'A TrendPulse member')
    into actor_name from public.profiles p where p.id = new.follower_id;
  insert into public.notifications (user_id, kind, title, body, target_url)
  values (new.followed_id, 'follow', 'New follower',
    coalesce(actor_name, 'A TrendPulse member') || ' started following you.',
    './members.html');
  return new;
end;
$$;

create or replace function private.tp_notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare recipient uuid; actor_name text;
begin
  select p.author_id into recipient from public.posts p where p.id = new.post_id;
  if recipient is null or recipient = new.author_id then return new; end if;
  select coalesce(p.display_name, 'A TrendPulse member')
    into actor_name from public.profiles p where p.id = new.author_id;
  insert into public.notifications (user_id, kind, title, body, target_url)
  values (recipient, 'comment', 'New comment',
    coalesce(actor_name, 'A TrendPulse member') || ': ' || left(new.content, 140),
    './members.html');
  return new;
end;
$$;

create or replace function private.tp_notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare recipient uuid; actor_name text;
begin
  select p.author_id into recipient from public.posts p where p.id = new.post_id;
  if recipient is null or recipient = new.user_id then return new; end if;
  select coalesce(p.display_name, 'A TrendPulse member')
    into actor_name from public.profiles p where p.id = new.user_id;
  insert into public.notifications (user_id, kind, title, body, target_url)
  values (recipient, 'like', 'New like',
    coalesce(actor_name, 'A TrendPulse member') || ' liked your post.',
    './members.html');
  return new;
end;
$$;

create or replace function private.tp_notify_short_comment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare recipient uuid; actor_name text; short_title text;
begin
  select s.author_id, s.title into recipient, short_title
    from public.shorts s where s.id = new.short_id;
  if recipient is null or recipient = new.author_id then return new; end if;
  select coalesce(p.display_name, 'A TrendPulse member')
    into actor_name from public.profiles p where p.id = new.author_id;
  insert into public.notifications (user_id, kind, title, body, target_url)
  values (recipient, 'short_comment', 'New Short comment',
    coalesce(actor_name, 'A TrendPulse member') || ' commented on ' || coalesce(short_title, 'your Short') || ': ' || left(new.content, 120),
    './shorts.html');
  return new;
end;
$$;

create or replace function private.tp_notify_short_like()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare recipient uuid; short_title text; actor_name text;
begin
  select s.author_id, s.title into recipient, short_title
    from public.shorts s where s.id = new.short_id;
  if recipient is null or recipient = new.user_id then return new; end if;
  select coalesce(p.display_name, 'A TrendPulse member')
    into actor_name from public.profiles p where p.id = new.user_id;
  insert into public.notifications (user_id, kind, title, body, target_url)
  values (recipient, 'short_like', 'New Short like',
    coalesce(actor_name, 'A TrendPulse member') || ' liked ' || coalesce(short_title, 'your Short') || '.',
    './shorts.html');
  return new;
end;
$$;

create or replace function private.tp_notify_direct_message()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare actor_name text;
begin
  select coalesce(p.display_name, 'A TrendPulse member')
    into actor_name from public.profiles p where p.id = new.sender_id;
  insert into public.notifications (user_id, kind, title, body, target_url)
  select cm.user_id, 'message', 'New message',
    coalesce(actor_name, 'A TrendPulse member') || ': ' || left(new.body, 140),
    './messages.html'
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;
  return new;
end;
$$;

revoke all on function private.tp_notify_follow() from public, anon, authenticated;
revoke all on function private.tp_notify_post_comment() from public, anon, authenticated;
revoke all on function private.tp_notify_post_like() from public, anon, authenticated;
revoke all on function private.tp_notify_short_comment() from public, anon, authenticated;
revoke all on function private.tp_notify_short_like() from public, anon, authenticated;
revoke all on function private.tp_notify_direct_message() from public, anon, authenticated;

drop trigger if exists tp_notifications_follow on public.follows;
create trigger tp_notifications_follow after insert on public.follows
for each row execute function private.tp_notify_follow();

drop trigger if exists tp_notifications_post_comment on public.comments;
create trigger tp_notifications_post_comment after insert on public.comments
for each row execute function private.tp_notify_post_comment();

drop trigger if exists tp_notifications_post_like on public.post_likes;
create trigger tp_notifications_post_like after insert on public.post_likes
for each row execute function private.tp_notify_post_like();

drop trigger if exists tp_notifications_short_comment on public.short_comments;
create trigger tp_notifications_short_comment after insert on public.short_comments
for each row execute function private.tp_notify_short_comment();

drop trigger if exists tp_notifications_short_like on public.short_likes;
create trigger tp_notifications_short_like after insert on public.short_likes
for each row execute function private.tp_notify_short_like();

drop trigger if exists tp_notifications_direct_message on public.messages;
create trigger tp_notifications_direct_message after insert on public.messages
for each row execute function private.tp_notify_direct_message();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
