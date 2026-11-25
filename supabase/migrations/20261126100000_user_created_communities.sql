-- Replace the seeded demo rooms with member-created communities.
-- This removes only the original 11 starter rooms; unrelated rooms are untouched.
delete from public.group_rooms
where slug in (
 'anime-lounge','manga-corner','hollywood-movies','bollywood-fans',
 'nollywood-hub','k-drama-club','c-drama-club','j-drama-club',
 'tv-series-lounge','gaming-zone','general-lounge'
);

alter table public.group_rooms
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists group_rooms_created_by_idx
  on public.group_rooms(created_by);

create or replace function public.create_group_room(
  room_name text,
  room_description text default '',
  room_category text default 'General'
)
returns public.group_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  creator uuid := auth.uid();
  clean_name text := btrim(coalesce(room_name, ''));
  clean_description text := btrim(coalesce(room_description, ''));
  clean_category text := btrim(coalesce(room_category, 'General'));
  base_slug text;
  created_room public.group_rooms;
begin
  if creator is null then
    raise exception 'Sign in to create a community.';
  end if;
  if char_length(clean_name) < 3 or char_length(clean_name) > 50 then
    raise exception 'Community names must be between 3 and 50 characters.';
  end if;
  if char_length(clean_description) > 300 then
    raise exception 'Community descriptions must be 300 characters or fewer.';
  end if;
  if clean_category not in ('Anime','Manga','Movies','TV Series','K-Drama','C-Drama','J-Drama','Gaming','Music','Sports','Books','General','Other') then
    raise exception 'Choose a valid community category.';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := 'community';
  end if;

  insert into public.group_rooms(name, slug, description, category, created_by)
  values (
    clean_name,
    left(base_slug, 55) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    clean_description,
    clean_category,
    creator
  )
  returning * into created_room;

  insert into public.group_room_members(room_id, user_id)
  values (created_room.id, creator)
  on conflict do nothing;

  return created_room;
end;
$$;

revoke all on function public.create_group_room(text,text,text) from public;
grant execute on function public.create_group_room(text,text,text) to authenticated;
