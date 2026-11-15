# Recipe Book Implementation Plan

**Goal:** Add a calm recipe book, varied goals, rolling-pin and kettle helpers; migrate deployment to a new private GitHub repository with public GitHub Pages.
**Architecture:** Buildless local JavaScript. Declarative chapters/goals, pure engine updates, validated version-compatible saves, reusable animation pipeline for swaps and helpers. No external runtime dependencies.
**Spec:** User's approved recipe-book direction and current request.

## Constraints
7×8 board, 24 moves, no timer, offline assets, recorded licensed audio, preserve old games. GitHub repository private; website public. Never make repo public to bypass plan restrictions. Old publication removed after verified replacement or explicit user choice.

## Review focus
- Old score-only saved games remain playable unchanged.
- Helpers do not spend moves or create new helper rewards; depleted inventory cannot be used.
- Recipe progress counts every removed piece once, including cascades.
- Last-move victory evaluated before defeat; completed levels recorded idempotently.
- Pages subpath and service worker scope work offline; new host cannot automatically read old-origin localStorage.

## Tasks
- [ ] Add tests then recipes.js (three chapters × six distinct goals, repeats with capped difficulty), helpers + goal evaluation in engine.js.
- [ ] Add validation/migration tests, completed levels and helper inventories; export/import backup with validation.
- [ ] Add paginated book, readable goal HUD, helper targeting + explicit apply/cancel, gentle rolling/steam animations; retain viewport fit.
- [ ] Run tests and browser QA at Pixel10/small widths, real gameplay and offline reload.
- [ ] Prepare GitHub Pages workflow and clean private repository, deploy, verify anonymous website and offline scope; disable previous public site.
