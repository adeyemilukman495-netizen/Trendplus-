-- TrendPulse: private media for newly uploaded Shorts.
-- Additive only: legacy public media URLs remain untouched so existing videos keep playing.
alter table public.shorts add column if not exists video_path text;
create unique index if not exists shorts_video_path_unique_idx
  on public.shorts(video_path) where video_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trendpulse-short-media', 'trendpulse-short-media', false, 52428800, array['video/mp4','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "TrendPulse private Shorts media readable by permitted viewers" on storage.objects;
create policy "TrendPulse private Shorts media readable by permitted viewers"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'trendpulse-short-media'
  and exists (
    select 1 from public.shorts s
    where s.video_path = storage.objects.name
  )
);

drop policy if exists "Members upload private Shorts into own folder" on storage.objects;
create policy "Members upload private Shorts into own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'trendpulse-short-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Members delete their own private Shorts media" on storage.objects;
create policy "Members delete their own private Shorts media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'trendpulse-short-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
