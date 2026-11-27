-- Award a small daily creator bonus for one eligible public Short.
-- The unique key on (user_id, challenge_id, challenge_date) makes this idempotent.
create or replace function public.award_short_upload_points(p_short_id uuid)
returns table(points_awarded integer, already_awarded boolean, total_points bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_points integer := 10;
  v_inserted_id bigint;
begin
  if v_user is null then
    raise exception 'Please sign in to receive creator points.';
  end if;

  if not exists (
    select 1 from public.shorts s
    where s.id = p_short_id
      and s.author_id = v_user
      and s.visibility = 'public'
      and s.video_path is not null
      and s.created_at >= now() - interval '15 minutes'
  ) then
    raise exception 'This Short is not eligible for the creator upload bonus.';
  end if;

  insert into public.pulse_point_events
    (user_id, challenge_id, challenge_date, selected_option, is_correct, points_awarded)
  values
    (v_user, 'short_upload', current_date, null, true, v_points)
  on conflict (user_id, challenge_id, challenge_date) do nothing
  returning id into v_inserted_id;

  return query
  select case when v_inserted_id is null then 0 else v_points end,
         v_inserted_id is null,
         coalesce((select sum(e.points_awarded) from public.pulse_point_events e where e.user_id = v_user), 0)::bigint;
end;
$$;

revoke all on function public.award_short_upload_points(uuid) from public, anon;
grant execute on function public.award_short_upload_points(uuid) to authenticated;
