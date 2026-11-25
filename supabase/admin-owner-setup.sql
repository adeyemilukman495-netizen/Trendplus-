-- Run this once in Supabase SQL Editor AFTER applying migration
-- 20261125110000_admin_revenue_dashboard.sql.
-- Replace the placeholder with the exact email on your TrendPulse owner account.
insert into public.trendpulse_admins (user_id)
select id
from auth.users
where lower(email) = lower('REPLACE_WITH_YOUR_TRENDPULSE_LOGIN_EMAIL')
on conflict (user_id) do nothing;

-- This should return your authorised owner account.
select u.email, a.user_id, a.created_at
from public.trendpulse_admins a
join auth.users u on u.id = a.user_id;
