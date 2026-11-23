# TrendPulse backend setup (free-tier friendly)

The GitHub Pages website is static, so it cannot run a database or authenticate users by itself. This folder prepares a real Supabase backend for accounts, persistent data, private messages, realtime updates and media uploads.

## Included backend capabilities

- Supabase Auth for member sign-up, sign-in and sessions.
- Postgres tables for profiles, posts, comments, likes, follows, watchlists and reviews.
- Private conversations and messages protected by row-level security.
- Shorts, 24-hour stories, fan clubs, battles and one-vote-per-member records.
- Reports, blocks and private notifications.
- Storage bucket for member-uploaded images/videos.
- Realtime database publication for feed, messages, notifications and other live changes.
- Private conversation channels with presence/typing support and a server-side read-receipt function.
- Row Level Security (RLS) policies across every browser-accessible table.

## What is still needed from the account owner

1. Create a Supabase project using the free plan.
2. Open SQL Editor and run the complete file `supabase/schema.sql`.
3. Open Project Settings → API Keys and copy the Project URL and publishable key.
4. Put those two values in `supabase-config.js` (the publishable key is designed for browser use).
5. Never place a secret/service-role key in the website or GitHub repository.

No TMDB, movie database, or paid entertainment API key is needed for this backend. Supabase account credentials are required because Supabase hosts the database and authentication.

## Files

- `supabase/schema.sql`: complete database, security policies, media bucket and realtime setup.
- `supabase-config.js`: empty configuration placeholders. Add your project URL and publishable key after creating the project.
- `backend-client.js`: browser integration helpers for auth, profiles, watchlists, reviews, community, chat, uploads, fan clubs, battles and reports.

## Important

The SQL schema is designed to be re-runnable: policies and trigger are replaced safely, tables and indexes are created if missing, and realtime publication entries are added only when absent.

The media bucket is public for content intentionally shared to the community. Upload, update and delete operations are restricted to each signed-in member's own folder. Do not upload private documents or sensitive personal files.

The Members page is the first page wired to the shared backend. The older Watchlist, Reviews, Shorts and Community preview pages still need their UI switched from browser-only storage to the shared backend before they behave as one connected social app.

The admin moderation dashboard is not enabled yet. Reports are saved for review, but a protected moderator role and owner dashboard still need to be configured. It must not be secured with a public or hard-coded password.

Supabase Free is $0, but includes limited database and file storage and pauses projects after a week of inactivity. Check the current limits before launch.
