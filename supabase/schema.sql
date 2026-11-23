-- TrendPulse production backend schema
-- Apply this entire file in Supabase SQL Editor.
-- Uses Supabase Auth, Postgres RLS, Realtime and Storage. No movie API key is needed.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'TrendPulse member',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'General',
  content text not null check (char_length(content) between 1 and 2000),
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  external_id text,
  title text not null,
  media_type text not null default 'Other',
  poster_url text,
  status text not null default 'Plan to watch'
    check (status in ('Plan to watch', 'Watching', 'Completed', 'On hold', 'Dropped')),
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  external_id text,
  title text not null,
  media_type text not null default 'Other',
  rating smallint not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 3000),
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  attachment_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.shorts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  caption text not null default '',
  category text not null default 'General',
  video_url text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.fan_clubs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'General',
  created_at timestamptz not null default now()
);

create table if not exists public.fan_club_members (
  club_id uuid not null references public.fan_clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  left_title text not null,
  right_title text not null,
  category text not null default 'General',
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.battle_votes (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice text not null check (choice in ('left', 'right')),
  created_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  caption text not null default '',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'profile', 'message', 'short', 'story', 'club')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  target_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists watchlist_user_created_idx on public.watchlist (user_id, created_at desc);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists conversations_updated_at_idx on public.conversations (updated_at desc);
create index if not exists shorts_created_at_idx on public.shorts (created_at desc);
create index if not exists clubs_category_idx on public.fan_clubs (category);

-- Helper functions avoid recursive RLS checks on membership tables.
create or replace function public.is_conversation_member(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversation_uuid
      and cm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_club_member(club_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select exists (
    select 1 from public.fan_club_members fm
    where fm.club_id = club_uuid
      and fm.user_id = (select auth.uid())
  );
$;

create or replace function public.is_conversation_creator(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select exists (
    select 1 from public.conversations c
    where c.id = conversation_uuid
      and c.created_by = (select auth.uid())
  );
$;

create or replace function public.create_trendpulse_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'member_' || substr(replace(new.id::text, '-', ''), 1, 10),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'TrendPulse member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_trendpulse_auth_user_created on auth.users;
create trigger on_trendpulse_auth_user_created
after insert on auth.users
for each row execute procedure public.create_trendpulse_profile();

-- Enable RLS on every browser-accessible table.
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.follows enable row level security;
alter table public.watchlist enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.shorts enable row level security;
alter table public.fan_clubs enable row level security;
alter table public.fan_club_members enable row level security;
alter table public.battles enable row level security;
alter table public.battle_votes enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.notifications enable row level security;

-- Profiles
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);
drop policy if exists "Members create their own profile" on public.profiles;
create policy "Members create their own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "Members update their own profile" on public.profiles;
create policy "Members update their own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Public community posts and comments; only their authors can change them.
drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable" on public.posts for select using (true);
drop policy if exists "Members publish their own posts" on public.posts;
create policy "Members publish their own posts" on public.posts for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors update their posts" on public.posts;
create policy "Authors update their posts" on public.posts for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "Authors delete their posts" on public.posts;
create policy "Authors delete their posts" on public.posts for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Comments are publicly readable" on public.comments;
create policy "Comments are publicly readable" on public.comments for select using (true);
drop policy if exists "Members add their own comments" on public.comments;
create policy "Members add their own comments" on public.comments for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors delete their comments" on public.comments;
create policy "Authors delete their comments" on public.comments for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Likes are publicly readable" on public.post_likes;
create policy "Likes are publicly readable" on public.post_likes for select using (true);
drop policy if exists "Members like as themselves" on public.post_likes;
create policy "Members like as themselves" on public.post_likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Members remove their own likes" on public.post_likes;
create policy "Members remove their own likes" on public.post_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Follows are publicly readable" on public.follows;
create policy "Follows are publicly readable" on public.follows for select using (true);
drop policy if exists "Members follow as themselves" on public.follows;
create policy "Members follow as themselves" on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists "Members unfollow as themselves" on public.follows;
create policy "Members unfollow as themselves" on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

-- Watchlists are private to each member.
drop policy if exists "Members read their own watchlist" on public.watchlist;
create policy "Members read their own watchlist" on public.watchlist for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Members add to their own watchlist" on public.watchlist;
create policy "Members add to their own watchlist" on public.watchlist for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Members update their own watchlist" on public.watchlist;
create policy "Members update their own watchlist" on public.watchlist for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Members delete from their own watchlist" on public.watchlist;
create policy "Members delete from their own watchlist" on public.watchlist for delete to authenticated using (user_id = (select auth.uid()));

-- Reviews are public; only their authors can edit or delete them.
drop policy if exists "Reviews are publicly readable" on public.reviews;
create policy "Reviews are publicly readable" on public.reviews for select using (true);
drop policy if exists "Members publish their own reviews" on public.reviews;
create policy "Members publish their own reviews" on public.reviews for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors update their reviews" on public.reviews;
create policy "Authors update their reviews" on public.reviews for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "Authors delete their reviews" on public.reviews;
create policy "Authors delete their reviews" on public.reviews for delete to authenticated using (author_id = (select auth.uid()));

-- Private conversations and messages.
drop policy if exists "Members can read their conversations" on public.conversations;
create policy "Members can read their conversations" on public.conversations for select to authenticated using (public.is_conversation_member(id));
drop policy if exists "Signed-in members can start conversations" on public.conversations;
create policy "Signed-in members can start conversations" on public.conversations for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "Conversation participants update conversation metadata" on public.conversations;
create policy "Conversation participants update conversation metadata" on public.conversations for update to authenticated using (public.is_conversation_member(id)) with check (public.is_conversation_member(id));

drop policy if exists "Members read conversation membership" on public.conversation_members;
create policy "Members read conversation membership" on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id) or user_id = (select auth.uid()));
drop policy if exists "Conversation creators add participants" on public.conversation_members;
drop policy if exists "Members can add themselves to conversations" on public.conversation_members;
-- Membership rows are inserted only inside the security-definer start_conversation() function.
drop policy if exists "Members leave conversations" on public.conversation_members;
create policy "Members leave conversations" on public.conversation_members for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Only conversation members read messages" on public.messages;
create policy "Only conversation members read messages" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists "Members send messages as themselves" on public.messages;
create policy "Members send messages as themselves" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id)
);
drop policy if exists "Members update messages in their conversations" on public.messages;

-- Shorts, fan clubs and stories.
drop policy if exists "Shorts are publicly readable" on public.shorts;
create policy "Shorts are publicly readable" on public.shorts for select using (true);
drop policy if exists "Members publish their own shorts" on public.shorts;
create policy "Members publish their own shorts" on public.shorts for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors manage their shorts" on public.shorts;
create policy "Authors manage their shorts" on public.shorts for all to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

drop policy if exists "Fan clubs are publicly readable" on public.fan_clubs;
create policy "Fan clubs are publicly readable" on public.fan_clubs for select using (true);
drop policy if exists "Members create fan clubs" on public.fan_clubs;
create policy "Members create fan clubs" on public.fan_clubs for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "Club owners manage their clubs" on public.fan_clubs;
create policy "Club owners manage their clubs" on public.fan_clubs for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
drop policy if exists "Club owners delete their clubs" on public.fan_clubs;
create policy "Club owners delete their clubs" on public.fan_clubs for delete to authenticated using (created_by = (select auth.uid()));

drop policy if exists "Fan club members are visible to signed-in members" on public.fan_club_members;
create policy "Fan club members are visible to signed-in members" on public.fan_club_members for select to authenticated using (true);
drop policy if exists "Members join fan clubs as themselves" on public.fan_club_members;
create policy "Members join fan clubs as themselves" on public.fan_club_members for insert to authenticated with check (
  user_id = (select auth.uid()) and (
    role = 'member' or exists (
      select 1 from public.fan_clubs fc
      where fc.id = club_id and fc.created_by = (select auth.uid())
    )
  )
);
drop policy if exists "Members leave fan clubs" on public.fan_club_members;
create policy "Members leave fan clubs" on public.fan_club_members for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Unexpired stories are public" on public.stories;
create policy "Unexpired stories are public" on public.stories for select using (expires_at > now());
drop policy if exists "Members publish their own stories" on public.stories;
create policy "Members publish their own stories" on public.stories for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors delete their stories" on public.stories;
create policy "Authors delete their stories" on public.stories for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Story views are visible to the story owner and viewer" on public.story_views;
create policy "Story views are visible to the story owner and viewer" on public.story_views for select to authenticated using (
  viewer_id = (select auth.uid()) or exists (
    select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid())
  )
);
drop policy if exists "Members record their own story views" on public.story_views;
create policy "Members record their own story views" on public.story_views for insert to authenticated with check (viewer_id = (select auth.uid()));

-- Battles: one vote per signed-in member per battle.
drop policy if exists "Battles are publicly readable" on public.battles;
create policy "Battles are publicly readable" on public.battles for select using (true);
drop policy if exists "Members create battles" on public.battles;
create policy "Members create battles" on public.battles for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "Battle votes are publicly readable" on public.battle_votes;
create policy "Battle votes are publicly readable" on public.battle_votes for select using (true);
drop policy if exists "Members cast one vote each" on public.battle_votes;
create policy "Members cast one vote each" on public.battle_votes for insert to authenticated with check (user_id = (select auth.uid()));

-- Moderation reports and blocks are private.
drop policy if exists "Members submit reports" on public.reports;
create policy "Members submit reports" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists "Members see their own reports" on public.reports;
create policy "Members see their own reports" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));

drop policy if exists "Members see their own blocks" on public.blocks;
create policy "Members see their own blocks" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
drop policy if exists "Members block other users" on public.blocks;
create policy "Members block other users" on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
drop policy if exists "Members unblock users" on public.blocks;
create policy "Members unblock users" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

drop policy if exists "Members read their own notifications" on public.notifications;
create policy "Members read their own notifications" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Members update their own notifications" on public.notifications;
create policy "Members update their own notifications" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Private Realtime channels: set private: true in the client and disable public channel access
-- in Supabase Dashboard → Realtime Settings.
drop policy if exists "TrendPulse conversation realtime read" on realtime.messages;
create policy "TrendPulse conversation realtime read"
on realtime.messages for select to authenticated
using (
  realtime.topic() = 'trendpulse:presence'
  or (
    realtime.topic() ~ '^conversation:[0-9a-fA-F-]{36}drop policy if exists "Members delete their own notifications" on public.notifications;
create policy "Members delete their own notifications" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- Public community media bucket. Upload/change/delete are restricted to the owner's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trendpulse-media',
  'trendpulse-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "TrendPulse media is publicly viewable" on storage.objects;
create policy "TrendPulse media is publicly viewable" on storage.objects for select using (bucket_id = 'trendpulse-media');
drop policy if exists "Members upload into their own media folder" on storage.objects;
create policy "Members upload into their own media folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'trendpulse-media' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Members update their own media" on storage.objects;
create policy "Members update their own media" on storage.objects for update to authenticated using (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
) with check (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
);
drop policy if exists "Members delete their own media" on storage.objects;
create policy "Members delete their own media" on storage.objects for delete to authenticated using (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
);

-- Enable database change streams for the social feed and chat.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['posts','comments','post_likes','messages','notifications','shorts','stories','battle_votes'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = split_part(realtime.topic(), ':', 2)::uuid
        and cm.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "TrendPulse conversation realtime write" on realtime.messages;
create policy "TrendPulse conversation realtime write"
on realtime.messages for insert to authenticated
with check (
  realtime.topic() = 'trendpulse:presence'
  or (
    realtime.topic() ~ '^conversation:[0-9a-fA-F-]{36}drop policy if exists "Members delete their own notifications" on public.notifications;
create policy "Members delete their own notifications" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- Public community media bucket. Upload/change/delete are restricted to the owner's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trendpulse-media',
  'trendpulse-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "TrendPulse media is publicly viewable" on storage.objects;
create policy "TrendPulse media is publicly viewable" on storage.objects for select using (bucket_id = 'trendpulse-media');
drop policy if exists "Members upload into their own media folder" on storage.objects;
create policy "Members upload into their own media folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'trendpulse-media' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Members update their own media" on storage.objects;
create policy "Members update their own media" on storage.objects for update to authenticated using (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
) with check (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
);
drop policy if exists "Members delete their own media" on storage.objects;
create policy "Members delete their own media" on storage.objects for delete to authenticated using (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
);

-- Enable database change streams for the social feed and chat.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['posts','comments','post_likes','messages','notifications','shorts','stories','battle_votes'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = split_part(realtime.topic(), ':', 2)::uuid
        and cm.user_id = (select auth.uid())
    )
  )
);
drop policy if exists "Members delete their own notifications" on public.notifications;
create policy "Members delete their own notifications" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- Public community media bucket. Upload/change/delete are restricted to the owner's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trendpulse-media',
  'trendpulse-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "TrendPulse media is publicly viewable" on storage.objects;
create policy "TrendPulse media is publicly viewable" on storage.objects for select using (bucket_id = 'trendpulse-media');
drop policy if exists "Members upload into their own media folder" on storage.objects;
create policy "Members upload into their own media folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'trendpulse-media' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Members update their own media" on storage.objects;
create policy "Members update their own media" on storage.objects for update to authenticated using (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
) with check (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
);
drop policy if exists "Members delete their own media" on storage.objects;
create policy "Members delete their own media" on storage.objects for delete to authenticated using (
  bucket_id = 'trendpulse-media' and owner_id = (select auth.uid())::text
);

-- Enable database change streams for the social feed and chat.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['posts','comments','post_likes','messages','notifications','shorts','stories','battle_votes'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
