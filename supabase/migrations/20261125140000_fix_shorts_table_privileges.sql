-- Restore the browser API privileges required by the Shorts feed and upload flow.
-- RLS remains enabled and limits each creator to their own writes.
grant select on table public.shorts to anon, authenticated;
grant insert, delete on table public.shorts to authenticated;
revoke update on table public.shorts from authenticated;
grant update (visibility, allow_comments, allow_download) on table public.shorts to authenticated;
