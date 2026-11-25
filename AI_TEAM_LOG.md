# TrendPulse AI Development Team Log

This file is the shared, asynchronous handoff point for AI-assisted development.

## Team roles

- **ChatGPT — Lead coordinator:** defines tasks, tracks decisions, coordinates fixes, and reports status to the project owner.
- **Claude — Development partner:** may inspect and implement approved changes in a dedicated branch or pull request.
- **GPT-6 — Independent reviewer:** reviews code, diffs, security, regressions, and test evidence; does not silently approve risky changes.

These are workflow roles, not a live group chat. The AIs do not automatically message one another. Each assistant must read and update this file (or the related GitHub issue/PR) when it has repository access. The project owner can relay this log when an assistant lacks GitHub access.

## Non-negotiable safeguards

1. Preserve existing features and user data.
2. Never run destructive database operations (DROP, TRUNCATE, destructive ALTER, broad DELETE, or equivalent) without explicit, informed approval.
3. Explain proposed changes and their impact before applying them.
4. Do not put Supabase service-role keys, access tokens, passwords, or other secrets in source files, issues, commits, or this log.
5. Use the Supabase publishable/anon key only in the browser where appropriate, and rely on correctly configured Row Level Security for data protection.
6. Prefer a separate branch and pull request for every change. Do not push unreviewed work directly to `main`.
7. Never claim a feature is tested unless the relevant test was actually run; record the test and result.
8. Do not merge or deploy without project-owner approval.

## Standard workflow

1. ChatGPT records a task and acceptance criteria below.
2. The implementing AI confirms scope, explains its proposed change, and works on a separate branch.
3. The implementer opens a pull request and records changed files, migration impact, and tests.
4. GPT-6 independently reviews the diff for correctness, security, accessibility, and regressions.
5. ChatGPT coordinates requested changes and updates the decision.
6. The project owner approves merge/deployment.

## Task and review entry template

Copy this template for each task:

### Task: [short name]
- **ID:** TP-###
- **Status:** Proposed / Approved / In progress / In review / Changes requested / Approved to merge / Done
- **Coordinator:** ChatGPT
- **Implementer:** Claude / ChatGPT / Human
- **Reviewer:** GPT-6
- **Scope:** [what will change]
- **Out of scope:** [what must not change]
- **Acceptance criteria:** [observable requirements]
- **Risk / database impact:** [none or exact additive migration details]
- **Proposed before implementation:** [explanation and approval]
- **Branch / PR:** [links]
- **Files changed:** [paths]
- **Tests run and results:** [commands/manual checks and outcomes]
- **GPT-6 review:** [findings, severity, file/line references]
- **Decision / owner approval:** [decision and date]

## Current baseline

- Repository: `adeyemilukman495-netizen/Trendplus-`
- Production/default branch: `main`
- Team setup branch: `ai-team/setup`
- This branch contains the shared workflow documentation, initial security review, and a staged authentication UI update. It has not changed main, deployed the site, or modified Supabase configuration, schema, or production data.

## Initial review queue

1. Inspect authentication and session handling, including Google sign-in and profile save.
2. Inspect Shorts upload flow and Supabase Storage policies.
3. Inspect comments, likes, views, and ownership checks.
4. Review RLS policies and ensure users cannot read or modify other users' private data.
5. Check frontend configuration for accidentally exposed secrets.
6. Verify GitHub Pages routing and Supabase authentication redirect URLs.

No item above is considered fixed or verified until the code and test evidence are reviewed.


## Initial independent review — 2026-11-25

GPT-6 completed a static first-pass review of the `main` branch. The findings and proposed (not applied) remediations are recorded in [SECURITY_REVIEW_INITIAL.md](./SECURITY_REVIEW_INITIAL.md).

Highest-priority findings:
- Shorts privacy choices are not persisted by the createShort client method, and the media bucket/public URL means database visibility does not make video bytes private.
- A push-triggered workflow can attempt to apply migrations to the production Supabase project from any branch.
- Two separate migration deployment workflows exist.
- Shorts-specific tables/columns are supplied by a separate SQL file, with unclear versioned setup order.
- Syntax validation currently runs on pushes, not pull requests.

Review was static only. No live database, browser, upload, or workflow execution was performed. No application code or database was changed. All fixes remain pending owner approval.


## Authentication screen implementation — 2026-11-25

- **Status:** Implemented on ai-team/setup; pending review and live testing.
- **Scope:** Reworked the existing Profile authentication area to match the supplied DeepSeek-style reference: dark full-screen layout, centered TrendPulse branding, rounded email/password fields, primary blue login button, clear sign-up switch, Google sign-in, password visibility toggle, and password-reset request.
- **Files changed:** profile.html, features.css, features.js, backend-client.js.
- **Preserved:** Existing profile editor, activity statistics, sign-out, Supabase email/password sign-up/sign-in, and Google OAuth flow.
- **Important provider note:** Apple sign-in is not displayed because the current client only implements Google OAuth and Apple provider setup has not been verified. Do not show a nonfunctional Apple button.
- **Database impact:** None. No SQL migration or Supabase schema change.
- **Production impact:** None. Changes are on the review branch only.
- **Tests:** Static code review only so far. Must test mobile layout, email signup/confirmation, password login, Google OAuth callback, password reset, and profile save against the published preview after approval.
- **Next:** Independent diff review, correct any issues, then continue the separate Shorts privacy/upload and migration-workflow fixes.

## Shorts, migration safety, and profile follow-up — 2026-11-25

- **Status:** Code changes staged on ai-team/setup; live Supabase migration and browser verification are still pending.
- **Shorts upload:** New Shorts upload to a new private Storage bucket (trendpulse-short-media). The app stores the object path, creates a one-hour signed playback URL after the Shorts row is visible under RLS, and removes the uploaded object if the database insert fails.
- **Shorts settings:** New Shorts persist visibility, comment permission, and download preference. The additive migration creates/ensures the privacy columns, short_likes and short_comments tables, row-level policies, private bucket, and Storage policies.
- **Legacy media:** Existing videos in the old public bucket are not moved or deleted; their original public URLs remain accessible. This avoids breaking already-posted videos. Owners should re-upload if they need private media storage.
- **Download note:** The download toggle controls the in-app download button only. It cannot prevent screen recording or copying media after a viewer has playback access.
- **Migration safety:** The former push-triggered production migration workflow is disabled. The canonical workflow is manual, restricted to main, serialized, uses the production GitHub Environment, and requires explicit confirmation that the existing manually-applied baseline is reconciled in Supabase migration history. The production Environment still needs required reviewers configured in GitHub repository settings.
- **Code checks:** JavaScript syntax validation now runs on pull requests and main pushes.
- **Profile save:** Duplicate usernames now return a clear message rather than a raw database error. Existing upsert/profile form remains.
- **Static tests:** backend-client.js and features.js parse successfully with JavaScript syntax checks; static assertions confirmed private upload, signed playback, persisted settings, migration policy, and PR workflow triggers.
- **Not tested:** Live Supabase SQL execution, Storage policy behaviour, email signup/confirmation, Google OAuth callback, password reset, profile save against the live database, and real device video playback. Do not mark these as passed until run.
- **No production changes:** No migration was executed, no Supabase secrets/settings were accessed, no production files were modified, and no user data was changed.