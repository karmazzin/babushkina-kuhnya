# Tea Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Add movable tea cups that are served upon reaching the last row.

**Architecture:** Special board token, shared pure gravity for engine and visible-board hints, explicit delivery animation frames. Current save format only; no migration branches.

**Tech Stack:** Existing browser ES modules, CSS, Node test runner, generated transparent PNG.

**Spec:** docs/superpowers/specs/2026-11-16-tea-delivery.md, approved in conversation.

## Global Constraints
- Board 7×8, five active dishes; maximum two goals and two tea cups.
- Start helper cannot win including cascades; helpers never remove cups or earn charges.
- Tea is served at row eight in the current action; current saves must retain it exactly.
- First six levels and recipe milestones 6+12n unchanged; no compatibility code.

## Review Focus
- Swapping a cup into the last row must count once even alongside food cascades.
- Helpers intersecting cups must not erase them, clear a plate beneath them or corrupt collected food counts.
- Multiple cups in one column and a no-moves reshuffle must preserve every undelivered cup.
- Saved completed turns are authoritative during animation cancellation or page reload.
- Hints for tea and another already completed goal must still make useful tea progress.

## Task 1: Engine, campaign and current saves
**Files:** dist/tea.js (new), engine.js, recipes.js, storage.js; tests/tea.test.js (new).
**Interfaces:** TEA=-1; teaCells(board); fallBoard(board,removed,fill); teaProgress(game); game.servedTea; frame.kind='match'|'tea' with servedTea; recipe.tea initial positions. freshBoard(random,pool,tea) preserves fixed cups.
- [x] Add failing behavioral tests: no tea triples, valid/invalid cup swaps, falling/last-row delivery, helper protection, stacked delivery, seeded start validation, fixed-position reshuffle and current-save roundtrip/corruption.
- [x] Implement pure gravity and tea frames, fixed-position generation, current schema validation, six authored tea levels and bounded later waves.
- [x] Run build/check:release and whole test suite, commit.

## Task 2: Hints and complete presentation
**Files:** dist/hints.js, app.js, book.js, gameplay.css, assets/foods/tea.png; tests/tea.test.js, dialog-routes.test.js; docs/tea-art-prompt.json.
**Interfaces:** hintAction unchanged, goal markup/hint/result use servedTea; first explanation uses data.seenTea; animation consumes frame.kind and servedTea.
- [x] Add failing tests for cup/clearing hints, mixed completed goals, visible tea progress, one-time guidance and its safe exit, save/resume and winning tea helpers at zero moves.
- [x] Implement goal display/book/help, delivery animation, highlighted bottom row and generated tea artwork; preserve normal match animation and reduced-motion path.
- [x] Run build/check:release and all tests; commit.

## Task 3: Balance, browser and review
**Files:** scripts/check-tea-balance.mjs (new), scripts/serve-balance-qa.mjs, docs/PLAYTEST-tea-2026-11-16.md.
- [x] Exercise repeated seeded games at tea levels, all helper opening areas, later waves; assert conserved cup count and no settled bottom-row cups. Tune authored difficulty if supported by evidence.
- [x] Browser: valid cup move, invalid move, helper passing through cup, last-row delivery and victory, zero moves, reload, cancel animation, small portrait/landscape, offline.
- [x] One independent whole-branch review; fix substantive findings with focused regressions, run final full checks, record evidence and commit.
