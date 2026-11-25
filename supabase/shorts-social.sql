-- TrendPulse Shorts social features and creator privacy settings
-- Run once in Supabase SQL Editor. Safe to re-run.
alter table public.shorts add column if not exists visibility text not null default 'public'
  check (visibility in ('public','followers','private'));
alter table public.shorts add column if not exists allow_comments boolean not null default true;
alter table public.shorts add column if not exists allow_download boolean not null default true;

create table if not exists public.short_likes (
  short_id uuid not null references public.shorts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (short_id,user_id)
);
create table if not exists public.short_comments (
  id uuid primary key default gen_random_uuid(),
  short_id uuid not null references public.shorts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists short_comments_short_created_idx on public.short_comments(short_id,created_at);
alter table public.short_likes enable row level security;
alter table public.short_comments enable row level security;

drop policy if exists "Shorts are publicly readable" on public.shorts;
create policy "Shorts visibility policy" on public.shorts for select using (
  visibility = 'public'
  or author_id = (select auth.uid())
  or (visibility = 'followers' and exists (
    select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = author_id
  ))
);
drop policy if exists "Short likes readable" on public.short_likes;
create policy "Short likes readable" on public.short_likes for select using (true);
drop policy if exists "Members like shorts as themselves" on public.short_likes;
create policy "Members like shorts as themselves" on public.short_likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Members remove own short likes" on public.short_likes;
create policy "Members remove own short likes" on public.short_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Short comments readable" on public.short_comments;
create policy "Short comments readable" on public.short_comments for select using (
  exists (select 1 from public.shorts s where s.id = short_id and
    (s.visibility = 'public' or s.author_id = (select auth.uid()) or
     (s.visibility = 'followers' and exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = s.author_id)))
  )
);
drop policy if exists "Members comment on shorts" on public.short_comments;
create policy "Members comment on shorts" on public.short_comments for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.shorts s where s.id = short_id and s.allow_comments = true
      and (s.visibility = 'public' or s.author_id = (select auth.uid()) or
      (s.visibility = 'followers' and exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = s.author_id)))
  )
);
drop policy if exists "Authors delete own short comments" on public.short_comments;
create policy "Authors delete own short comments" on public.short_comments for delete to authenticated using (author_id = (select auth.uid()));

grant select on public.short_likes, public.short_comments to anon, authenticated;
grant insert, delete on public.short_likes to authenticated;
grant insert, delete on public.short_comments to authenticated;
grant update (visibility, allow_comments, allow_download) on public.shorts to authenticated;
