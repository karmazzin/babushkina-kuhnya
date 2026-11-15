# Larger goals and visible update checks

User requested a larger dish/counter on the tray and reported no update button.

Changed single goals to horizontal layout (82px food, 34px progress), two goals to 64px food and 28px progress. Compact portrait HUD gets 100px height so counters stay inside the tray. Smaller responsive sizes preserve all controls.

Update investigation: the live Chrome tab was running the earlier logo layout with no update notice. Reloading triggered a download; the notice appeared later. Existing checks swallowed network failures and could wait an hour between checks. The absence of a notice did not establish that the installed version was current. Exact conditions on the physical phone were not observable.

Added an explicit settings check with checking/current/available/error messages. It waits for worker installation (not just script download), times out after 45 seconds, and never activates automatically. Apply still uses the existing save-before-update path. Added immediate and five-minute automatic checks and disabled HTTP caching for worker script checks.

Verification:
- Three new tests failed before implementation; all 126 tests then passed.
- Independent review: no blockers; 11 focused update/registration tests passed.
- Chrome: 412×915 single goal, 320×568 single/two goals and settings; 844×390 two goals. No clipped controls or scrolling.
- Played level 2 to victory, applied kettle, continued to level 3.
- Manual check reported current version. Stopped local server: check reported network error. Restarted with a new worker: retry offered update; applying restored level 3 and the same board/counters.
- Physical Android/iOS not tested.
