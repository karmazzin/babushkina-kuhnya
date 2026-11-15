# Daily Treat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a kind daily activity with persistent postcards and gently increase campaign challenge.
**Architecture:** Separate daily state from campaign. Pure daily calendar/reward module and reusable card renderer; seeded RNG supported by engine. Existing app selects the active save slot explicitly.
**Tech Stack:** Buildless JS/CSS, node:test, existing original artwork.
**Spec:** docs/superpowers/specs/2026-11-15-daily-treat.md

## Global Constraints
No timers or streaks; preserve old saves and offline caching. At most two goals per board. Existing campaign never replaced by daily activity. No new dependencies.

## Review Focus
- Same day wins and reloads cannot duplicate rewards.
- Midnight or returning after a gap does not discard a pending level.
- Daily and campaign transitions never mix levels, best score or helper inventory.
- Import validates dates, RNG and collection; old saves migrate safely.
- Small screens fit menu, reward, collection and mixed-goal board.

## Tasks
- [x] 1. Failing tests for day keys, deterministic RNG/retries/continuation, separate slots and reward idempotence. Implement daily.js and engine RNG plumbing, storage migration and validation.
- [x] 2. Add daily action, day rollover handling, mode-aware board/outcome and collection renderer; styles using existing assets. Cache files. Browser verify transitions and reward.
- [x] 3. Test per-turn helper cap and new-game recipe progression; adjust later plate layouts/food targets/moves. Compare seeded policy results and retain easy introductions. No changes to an in-progress game's rules.
- [x] 4. Whole-branch review, unit suite, hands-on play, small-screen/offline/reload checks, docs and existing Pages deployment.

## Ledger
User approved simple daily level + postcard, and selected gentle difficulty. Initial clean checkout ab73371. Work in current checkout on codex/daily-treat. Existing project workflow and assets retained.

Implementation and browser checks complete; 58 tests pass. Independent review found and prompted a regression-tested v2 save-key migration to isolate old writers. Seeded policy sweep confirms longer late levels. Pages publication is the final delivery step.
