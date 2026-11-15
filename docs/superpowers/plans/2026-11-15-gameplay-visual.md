# Gameplay Visual Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Give the board breathing room and replace web-like HUD/boosters with illustrated kitchen objects.
**Architecture:** Preserve engine and DOM IDs. Introduce scoped gameplay CSS, raster HUD assets and helper images. Keep dynamic text accessible.
**Tech Stack:** Existing vanilla JS/CSS, image_gen PNG assets.
**Spec:** docs/superpowers/specs/2026-11-15-gameplay-visual-design.md

## Constraints and review focus
No game rule/save changes. No visible passive helper instructions. Responsive HUD for score, two dishes and plates; native-sized pointer targets. Preserve selected helper cancellation and animation. Offline file list complete. No links added to shared postcards.

- [x] Generate and inspect four transparent assets: goal tray, moves plate, rolling pin, teapot.
- [x] Simplify header/footer and remove decorative symbols; restyle layout with scoped gameplay.css; wire existing helper visuals to raster art.
- [x] Run existing tests; browser play/booster/select/cancel/reload; automated goal variants; Pixel/small/landscape checks. Adjust only based on visible findings.
- [x] Review, verify offline, document checks, publish current GitHub Pages without overwriting parallel changes.
