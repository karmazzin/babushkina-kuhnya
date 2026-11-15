# Gameplay visual verification — 2026-11-15

- Chrome viewport 412×915: illustrated goal tray, move plate and raster helpers; no gameplay logo or passive instruction strips. Saved preview outside published dist.
- Chrome 320×568 and 844×390: whole board, header and helpers visible without scrolling. Landscape uses controls on the left and board on the right.
- Played level 1 to victory with pointer drags; next level opened. Rolling-pin selection cancels on second tap without spending a move. Kettle applied to the board and consumed one charge.
- New header opens sound settings and help; explicit return resumes game.
- Applied waiting update; level 2 persisted. Stopped local server, reloaded, continued and made a valid move offline (4/12, 23 moves). New art and CSS remained available.
- npm test: 123 passed, zero failures. Covers legacy score goals, dishes, plates, results, save migration and offline cache manifest. git diff --check passed.
- Independent code review: no blocking findings; 14 targeted offline/result tests passed.
- Limits: Chrome viewport emulation only, not physical Android/iOS. Manual screenshot checks used single-dish levels; mixed-goal and legacy-score behavior covered by automated tests and code review, not additional screenshots.

Assets generated with image_gen; exact prompts in gameplay-art-prompts.json. Four transparent PNGs resized with sips; dynamic counters remain HTML text. No rule or save-format changes.
