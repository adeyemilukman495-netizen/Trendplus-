-- WhatsApp-style TrendPulse fandom group chats.
create table if not exists public.group_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  category text not null default 'General',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.group_room_members (
  room_id uuid not null references public.group_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id)
);
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.group_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists group_messages_room_created_idx on public.group_messages(room_id,created_at);
alter table public.group_rooms enable row level security;
alter table public.group_room_members enable row level security;
alter table public.group_messages enable row level security;
drop policy if exists "Group rooms are visible" on public.group_rooms;
create policy "Group rooms are visible" on public.group_rooms for select using (true);
create or replace function public.is_group_room_member(room_uuid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.group_room_members m where m.room_id=room_uuid and m.user_id=(select auth.uid())); $$;
revoke all on function public.is_group_room_member(uuid) from public;
grant execute on function public.is_group_room_member(uuid) to authenticated;
drop policy if exists "Members can see group membership" on public.group_room_members;
create policy "Members can see group membership" on public.group_room_members for select to authenticated
using (user_id=auth.uid() or public.is_group_room_member(room_id));
drop policy if exists "Room members read group messages" on public.group_messages;
create policy "Room members read group messages" on public.group_messages for select to authenticated
using (public.is_group_room_member(room_id));
drop policy if exists "Room members send group messages" on public.group_messages;
create policy "Room members send group messages" on public.group_messages for insert to authenticated
with check (sender_id=auth.uid() and public.is_group_room_member(room_id));
grant select on public.group_rooms to anon,authenticated;
grant select on public.group_room_members,public.group_messages to authenticated;
grant insert on public.group_messages to authenticated;
create or replace function public.join_group_room(room_uuid uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is null then raise exception 'Sign in required to join a community.'; end if;
 if not exists(select 1 from public.group_rooms where id=room_uuid) then raise exception 'Community not found.'; end if;
 insert into public.group_room_members(room_id,user_id) values(room_uuid,auth.uid()) on conflict do nothing;
 return true;
end;
$$;
revoke all on function public.join_group_room(uuid) from public;
grant execute on function public.join_group_room(uuid) to authenticated;
insert into public.group_rooms(name,slug,description,category) values
 ('Anime Lounge','anime-lounge','Talk about anime releases, characters and recommendations.','Anime'),
 ('Manga Corner','manga-corner','Discuss manga chapters, stories and artwork.','Manga'),
 ('Hollywood Movies','hollywood-movies','Chat about Hollywood films and new releases.','Hollywood'),
 ('Bollywood Fans','bollywood-fans','Discuss Bollywood films, actors and soundtracks.','Bollywood'),
 ('Nollywood Hub','nollywood-hub','Talk about Nigerian films and the Nollywood scene.','Nollywood'),
 ('K-Drama Club','k-drama-club','Share thoughts on Korean dramas and episodes.','K-Drama'),
 ('C-Drama Club','c-drama-club','Discuss Chinese dramas and recommendations.','C-Drama'),
 ('J-Drama Club','j-drama-club','Talk about Japanese dramas and series.','J-Drama'),
 ('TV Series Lounge','tv-series-lounge','Chat about series from around the world.','TV Series'),
 ('Gaming Zone','gaming-zone','Discuss games, updates and gaming culture.','Gaming'),
 ('General Lounge','general-lounge','Meet other TrendPulse members and chat.','General')
on conflict(slug) do nothing;
do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
 and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='group_messages') then
  alter publication supabase_realtime add table public.group_messages;
 end if;
end $$;
