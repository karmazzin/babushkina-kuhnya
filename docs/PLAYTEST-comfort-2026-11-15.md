# Comfort update playtest — 2026-11-15

## Verification
- Full node:test suite: 50 passing. New coverage: plate progress/settlement, helper removal, last-move win, legacy and invalid saves, gesture interpretation, effect gain/cooldown/mute, instruction changes after a completed objective.
- Fresh independent code review found gutter release cancelling an otherwise valid swipe. Reproduced in browser (23 moves unchanged), fixed board-boundary hit test, repeated same gesture (23 → 22).
- Chrome hands-on play: completed levels 1–5 using both swipes and two taps, plus rolling pin. Level 4 completed by ordinary matching/cascades.
- Level 6: kettle removed all six plates; one charge consumed, 24 moves retained, food objective remained 1/10. Instruction now switches to remaining dishes. Progress preserved after reload and explicit update button.
- Cancelled kettle by dragging from field and releasing outside: four plates, one kettle and 24 moves unchanged. Selecting the same helper twice cancels it without a charge.
- Settings: slider zero then 20%; reload retained 20%. Independent music/effects controls remain.
- Layout screenshots inspected at 390×844, 320×568 and 844×390. Board, helper controls and settings fit without page scrolling.
- Offline: terminated local HTTP server, reloaded from service worker, continued level 6 and made a successful move (24 → 23, food 1 → 4).
- Deterministic engine sweep: `node scripts/check-level-balance.mjs`, 100 seeded games per level. Greedy policy reads current matches/objectives and uses helpers in last eight moves; all 1,200 completed. Mean regular moves per level: 6.1, 7.1, 6.1, 3.0, 10.0, 7.0, 6.9, 8.1, 5.3, 7.8, 9.0, 10.3. This checks feasibility under that policy, not human win rates.

## Observations and limits
The introductory plate level is deliberately easy; mixed plate/dish goals require attention to two counters. Early levels can complete rapidly on lucky cascades. Longer cascades can still be accelerated by tapping the board. No timers or forced daily play added.

Browser testing used pointer drags and mobile viewport sizes on desktop Chrome, not a physical Android/iPhone installation. Real touch feel and subjective audio pleasantness need a short check on the player's phone. The audio changes are licensed recordings with low-pass filters/fades and substantially reduced gain; music is unchanged.
