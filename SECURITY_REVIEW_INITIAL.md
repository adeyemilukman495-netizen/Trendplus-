# TrendPulse Independent Review — Initial Pass

**Review date:** 2026-11-25  
**Reviewed ref:** `main`  
**Scope:** GitHub Pages frontend, Supabase browser client, SQL migration, Shorts upload flow, GitHub Actions workflows.  
**Execution note:** Static source review only. No live Supabase queries, browser tests, upload tests, or GitHub Actions runs were performed. Findings below are based on repository code, not a live penetration test.

## Findings

### P0 / Critical — Shorts privacy selection is not enforced for the uploaded media
**Files:** `features.js`, `backend-client.js`, `supabase/migrations/20261124230000_trendpulse_initial_schema.sql`, `supabase/shorts-social.sql`

The upload form lets a creator choose Public, Followers only, or Only me, but `backend.createShort()` inserts only author, title, caption, category, video URL, and thumbnail URL. It does not pass `visibility`, `allow_comments`, or `allow_download` from the form. Even if those values were saved, the upload uses a public Storage bucket and returns a public URL. A private/follower-only database row therefore does not make the underlying video private; anyone who obtains the URL may still access it. The page itself warns about this limitation.

**Impact:** The UI promises privacy settings that are not fully implemented. A creator may believe a video is private when its media URL remains publicly accessible.

**Recommended change (not applied):** First decide the intended product behaviour. For real privacy, move private/follower-only media to a private bucket and serve it using short-lived signed URLs after server-side authorization; enforce follower visibility in database policies. Pass the three settings into `createShort`, validate them server-side, and test anonymous, follower, non-follower, and owner access. Do not simply change the bucket to private without designing playback authorization, because that would break existing public playback and downloads.

### P1 / High — Automatic production migration workflow can run from any pushed branch
**File:** `.github/workflows/apply-trendpulse-schema.yml`

The workflow triggers on pushes touching the migration/workflow paths, has no branch restriction, and targets the fixed production Supabase project reference. A push to a feature branch can therefore attempt to apply a database migration to production when the repository secret is available.

**Impact:** An unreviewed branch could change the production database. This conflicts with the team's approval-before-deployment rule.

**Recommended change (not applied):** Remove automatic production execution from ordinary push events. Require manual dispatch or a protected environment with required reviewers, and restrict production migration execution to an approved release branch. Keep schema verification read-only.

### P1 / High — Multiple migration deployment paths create inconsistent operational risk
**Files:** `.github/workflows/apply-trendpulse-schema.yml`, `.github/workflows/supabase-migrations.yml`

There are two different ways to apply schema changes: a push-triggered Supabase Management API request and a manually dispatched Supabase CLI `db push`. They have different execution paths and potentially different migration-history behaviour. The manual workflow also uses `--yes`, which removes the CLI's interactive confirmation.

**Impact:** Operators may not know which workflow is authoritative; a migration can be applied unexpectedly or migration history can become confusing.

**Recommended change (not applied):** Choose one documented deployment path. Require explicit approval before production execution, inspect the pending migration list, and use a staging project for validation. Do not run either workflow as part of this review.

### P1 / High — Shorts privacy migration is separate from the main schema migration
**Files:** `supabase/migrations/20261124230000_trendpulse_initial_schema.sql`, `supabase/shorts-social.sql`, `supabase/README.md`

The application code queries `short_likes`, `short_comments`, and Shorts privacy columns. The main initial schema migration and the separate `shorts-social.sql` script are distinct setup artefacts. The README describes running the main schema but does not clearly establish an ordered, versioned migration for the Shorts additions.

**Impact:** A project that runs only the documented main migration may encounter missing relation/column errors in Shorts features.

**Recommended change (not applied):** Put the Shorts additions into a separate timestamped, additive migration and document the exact order. Before applying it, check the live schema and migration history; do not rerun ad-hoc SQL blindly.

### P2 / Medium — Short comment/like functions rely on database additions not guaranteed by main migration
**Files:** `backend-client.js`, `supabase/shorts-social.sql`

The client calls `short_comments` and `short_likes`, but those objects are created in the standalone Shorts SQL file. This reinforces the setup-order issue above.

**Recommended change (not applied):** Add automated schema checks for these tables, columns, policies, and grants, then exercise comment/like flows with signed-in and signed-out test accounts.

### P2 / Medium — Browser profile save depends on the profile row existing and username uniqueness
**Files:** `backend-client.js`, `features.js`, SQL profile trigger

The profile form calls an upsert with a user-supplied username. The database has a unique constraint on `profiles.username`. A username already used by another account will correctly fail, but the UI only displays the raw backend error and gives no inline field-specific guidance. Also, if the auth-user trigger did not create a profile, the upsert may be blocked or behave differently depending on the live RLS grants/policies and schema state.

**Recommended change (not applied):** Verify the profile trigger and grants on the live project, add a username availability check for user experience (the unique constraint remains authoritative), and show clear inline save errors. Test email signup, Google signup, first profile load, and username collision.

### P2 / Medium — Automated code validation does not run on pull requests
**File:** `.github/workflows/trendpulse-code-check.yml`

The syntax workflow is configured for `push` only. Pull requests can be opened without this check running against the proposed diff.

**Recommended change (not applied):** Add a `pull_request` trigger for relevant paths and require the check before merge. Keep deployment/migration workflows separate from validation.

## Positive observations

- The browser uses a Supabase publishable key, not a service-role key. Publishable keys are expected to be public; RLS must remain the security boundary.
- The main schema enables RLS on the listed application tables and includes owner checks on several write policies.
- Message reads are restricted through a conversation-membership helper.
- Upload paths are namespaced under the authenticated user's UUID and storage writes are constrained by folder ownership.
- User-generated text is escaped in many of the reviewed rendering paths.

## Immediate safe next steps

1. Confirm whether Shorts privacy is meant to be real privacy or only feed-level visibility. If real privacy is intended, approve a private-storage design before implementation.
2. Disable or protect the push-triggered production migration workflow before further migration-file pushes.
3. Establish one migration deployment path and a versioned Shorts migration.
4. Add PR-based syntax validation.
5. Test the profile save and Shorts upload flows in the published GitHub Pages site using a normal test account.

## Change control

No application source, database schema, Supabase settings, production data, or deployment workflow was modified during this review. This file is a review report only. All recommended fixes remain unapplied pending project-owner approval.
