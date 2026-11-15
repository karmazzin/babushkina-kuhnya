# Comfortable Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the user-approved PWA comfort update with twelve varied levels.
**Architecture:** Preserve buildless modules and serialized legacy goals. Add pure gesture interpretation, plate-cell state and authored early-level definitions.
**Tech Stack:** JavaScript ES modules, CSS, node:test, stock CC0 audio.
**Spec:** docs/superpowers/specs/2026-11-15-comfortable-levels.md

## Global Constraints
Preserve old saves and GitHub Pages subpath/offline updates. No audio synthesis. No Apply step. Keep desktop keyboard and two-tap controls. One or two objectives per level.

## Review Focus
- Legacy running level keeps its goals after update.
- Plate cells do not fall or count twice; boosters and last move can complete them.
- Diagonals, short taps, pointer cancellation and outside release never trigger accidental actions.
- Helper preview stays correct at corners and spends exactly once.
- Small mobile viewport fits all controls and both objectives.

## Tasks
- [x] 1. Add failing engine/storage tests for plates, authored levels and old saves. Implement recipes.js, engine.js, storage.js and goal presentation book.js. Run full suite.
- [x] 2. Add failing pure gesture tests. Implement gestures.js and pointer previews in app.js, direct helper activation, accessible labels and plate rendering. Verify cancellation through browser.
- [x] 3. Add tests for effect gain, mute, cooldown and saved slider. Adapt licensed stock audio and audio.js/settings; cache all new assets. Run suite.
- [ ] 4. Hands-on mobile browser playtest, deterministic engine balance sweep, reload/offline and old-save checks. Fix observed issues, document limits, review diff, publish existing GitHub Pages update and verify deployment.

## Execution ledger
Baseline: clean GitHub checkout aa13efa, 42 tests passing. Existing stale Sites checkout untouched. Work on codex/comfortable-levels in current checkout to preserve user's working path. User explicitly requested implementation of agreed proposal; no further design approval needed. No dependency installation needed.

Implemented and browser-tested; see docs/PLAYTEST-comfort-2026-11-15.md. Final deployment verification pending.
