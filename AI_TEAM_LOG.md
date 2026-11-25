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
- This setup adds documentation only. It does not change application code, Supabase configuration, schema, or production data.

## Initial review queue

1. Inspect authentication and session handling, including Google sign-in and profile save.
2. Inspect Shorts upload flow and Supabase Storage policies.
3. Inspect comments, likes, views, and ownership checks.
4. Review RLS policies and ensure users cannot read or modify other users' private data.
5. Check frontend configuration for accidentally exposed secrets.
6. Verify GitHub Pages routing and Supabase authentication redirect URLs.

No item above is considered fixed or verified until the code and test evidence are reviewed.
