create table if not exists public.daily_duel_scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  played_on date not null,
  score smallint not null check (score between 0 and 5),
  created_at timestamptz not null default now(),
  constraint daily_duel_scores_user_day_unique unique (user_id, played_on)
);
alter table public.daily_duel_scores enable row level security;
revoke all on public.daily_duel_scores from anon, authenticated;
create index if not exists daily_duel_scores_day_score_idx
  on public.daily_duel_scores (played_on desc, score desc, created_at asc);
create or replace function public.submit_daily_duel_score(p_score integer)
returns table (saved_score integer, played_on date, already_submitted boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := (now() at time zone 'UTC')::date;
  v_score integer;
  v_inserted boolean := false;
begin
  if v_user_id is null then raise exception 'Sign in is required to save a Daily Duel result.'; end if;
  if p_score is null or p_score < 0 or p_score > 5 then raise exception 'Daily Duel score must be between 0 and 5.'; end if;
  insert into public.daily_duel_scores (user_id, played_on, score)
  values (v_user_id, v_day, p_score)
  on conflict (user_id, played_on) do nothing
  returning score into v_score;
  if found then
    v_inserted := true;
  else
    select s.score into v_score from public.daily_duel_scores s
    where s.user_id = v_user_id and s.played_on = v_day;
  end if;
  return query select v_score, v_day, not v_inserted;
end;
$$;
create or replace function public.get_daily_duel_leaderboard()
returns table (rank bigint, username text, score integer, played_on date)
language sql security definer set search_path = ''
as $$
  select row_number() over (order by s.score desc, s.created_at asc, s.user_id),
    coalesce(nullif(p.display_name, ''), nullif(p.username, ''), 'TrendPulse member'),
    s.score::integer, s.played_on
  from public.daily_duel_scores s
  left join public.profiles p on p.id = s.user_id
  where s.played_on = (now() at time zone 'UTC')::date
  order by s.score desc, s.created_at asc, s.user_id
  limit 50;
$$;
revoke all on function public.submit_daily_duel_score(integer) from public, anon;
revoke all on function public.get_daily_duel_leaderboard() from public, anon;
grant execute on function public.submit_daily_duel_score(integer) to authenticated;
grant execute on function public.get_daily_duel_leaderboard() to authenticated;
