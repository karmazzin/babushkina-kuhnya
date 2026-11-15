# Balance and Recipes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved balance, 42 levels, 12 recipes, 24 postcards, ten food illustrations and relaxed mode on the existing 7×8 PWA.

**Architecture:** Keep the pure engine and small ES modules. Separate food catalogue, authored level recipes, reward catalogue/progression and game-aware hints. Version new game rules and migrate saves to a separate key so old tabs cannot discard new collections. Preserve ongoing legacy games.

**Tech Stack:** Browser ES modules, HTML/CSS, Node.js built-in test runner, local generated bitmap assets.

**Spec:** docs/superpowers/specs/2026-11-15-balance-and-recipes.md (approved in conversation).

## Global Constraints
- Board 7×8; five equiprobable active dishes, ten catalogue entries, at most one introduction per 12-level block.
- Helpers: one initially, cap three, no cost, no rewards from helper cascades; no first-action helper victory.
- Save and restore three independent modes; preserve existing recipes, postcards and in-progress legacy games.
- Recipe milestones 6 + 12n, 12 unique recipes. No forced daily engagement, timer, payments, telemetry or external runtime assets.
- UI has one safe exit per dialog, touch and keyboard controls, all assets available offline.

## Review Focus
- Cascades can clear distant plates, so geometric checks alone are insufficient.
- A zero-move helper phase must survive save/reload, menu, update and daily date changes.
- Old collections beyond 12 cards must keep their old artwork after expanding the catalogue.
- Old completed chapters must retain recipes while a future milestone awards a new one exactly once.
- Saved active food pools and goal types must agree; malformed or stale saves must not erase recoverable legacy data.

## Task 1: Pure engine and meaningful hints
**Files:** dist/engine.js, dist/foods.js (new), dist/hints.js (new), dist/pacing.js, tests/balance-engine.test.js (new).
**Interfaces:** newGame(level, options?), createGame(recipe, options), freshBoard(random, pool?), gameStatus(game), isActiveGame(game), finishAttempt(game); hintAction(game) returns swap/helper descriptor using visible board only. New rule version/pool/RNG are saved in game.
- [ ] Write behavioral tests for goal hints, clipped objective credit, tie bias, last-move helper finish, pool refill and first-helper full-cascade rejection.
- [ ] Run RED; implement engine, seeded board validation with bounded generation and checked fallback; implement hints without looking at future RNG.
- [ ] Run focused and whole test suites; commit implementation and tests.

## Task 2: Authored progression, recipes and storage
**Files:** dist/recipes.js, dist/recipe-cards.js (new), dist/progression.js (new), dist/daily.js, dist/relaxed.js (new), dist/storage.js; tests/content-progress.test.js and save migration tests.
**Interfaces:** levelRecipe(level) returns goals/plates/moves/pool/title/chapter; recipeMilestone(index), recordCampaignWin(data), nextRecipeReward(data); migrate legacy recipes and postcard artwork indices. newRelaxedGame(order) uses createGame with unlimited moves.
- [ ] Test milestone idempotence, migration with earned recipes, first six settings, all 42 levels/pools, four daily types, independent relaxed mode and corrupt saves.
- [ ] Run RED; author 42 levels, 12 recipe texts, 12-level pools and bounded later waves; implement versioned save migration and progress ledger.
- [ ] Run relevant plus whole suite; commit.

## Task 3: Complete player-facing flows
**Files:** dist/app.js, dist/book.js, dist/index.html, dist/gameplay.css, dist/style.css, dist/postcards.js; tests/dialog-routes.test.js and new mode routes.
**Interfaces:** campaign wins through recordCampaignWin; active mode can be regular/daily/relaxed; rendered recipe shelf invokes recipe pages; helper phase resumes and permits voluntary finish.
- [ ] Add failing integration tests for helpers at zero, all modes' result exits, recipe pages/back, helper guidance and legacy restore.
- [ ] Implement useful hints/overlays, reward/goal-led results, recipe shelf and next reward, relaxed controls, settings label, compact layout and stable postcard identities.
- [ ] Run focused and whole suite; commit.

## Task 4: Finished artwork and offline packaging
**Files:** dist/assets/postcards/card-13..24.jpg, dist/assets/foods/*.png, dist/assets/recipes/*.jpg; docs/balance-art-prompts.json; style references and sw.js/build release manifest.
- [ ] Generate twelve distinct postcards, five new distinguishable dish icons and recipe illustrations with imagegen; inspect each and save into repository.
- [ ] Integrate final artwork, test catalogue references and complete offline asset inclusion; visually inspect small screens and sharing download.
- [ ] Commit finished assets and references.

## Task 5: Verification and integration
**Files:** scripts/check-level-balance.mjs, docs/PLAYTEST-balance-2026-11-15.md; relevant regressions found during QA.
- [ ] Compare deterministic policies across 1–42 and later milestones; verify all start helper areas, daily date samples, capped complexity and generation latency.
- [ ] Exercise actual browser at 320×568, 390×844/Pixel and landscape; victory/loss/helper finish/retry, modes, book, recipe pages, reload, offline.
- [ ] Integrate completed update fixes if available, run release checks and full tests.
- [ ] Obtain one independent whole-branch review, fix substantive findings with regression tests, record results and commit. Do not publish automatically without existing authorization.
