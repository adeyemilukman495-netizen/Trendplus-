-- Restore browser API privileges for the public community posts feed.
-- RLS policies remain the security boundary: public reads; authenticated owners write only their own posts.
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;
