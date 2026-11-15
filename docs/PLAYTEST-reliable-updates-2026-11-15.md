# Reliable updates — verification

## Changes
- Attach to the existing registration before network work; share simultaneous registration attempts. First-install activation is distinguished from later controller changes.
- Observe worker state before starting a network check; a waiting worker remains discoverable even if the update request stalls. Visible checking/downloading/available/error states; checks on launch, return, reconnect and a visible-page interval.
- Build-time SHA-256 manifest and deterministic release ID. Reuse unchanged verified resources (including legacy caches), download changes with four workers and three bounded attempts. Partial or incorrect downloads cannot activate. Preserve two older release caches.
- Only an explicit request activates/reloads; wait for busy to end and successfully save first. Other tabs are offered an update but are not reloaded. Before updating, a clean stale tab adopts the newer persisted snapshot. Conflicting unsaved changes block overwrites and updating.
- Storage events during a turn are deferred. Completion or explicit navigation/cancellation consumes the pending snapshot; a write guard also catches a newer save before the event is delivered.

## Evidence
149 automated tests pass. New regressions cover blocked registration, first claim followed by later update, waiting-worker races, partial/integrity failures, verified reuse, offline cache/range requests, deferred remote saves and stale writes. Release manifest consistency and diff whitespace checks pass. Independent reviewer confirmed fixes to both discovered lifecycle/storage blockers.

Chrome, isolated localhost origin, two real tabs:
1. First installation completes with no spurious update banner.
2. Build a second release while both tabs remain open: both offer it without reload or closing tabs.
3. Start a valid move in A and press Update during the cascade: visible “Обновим после этого хода…” with aria-busy=true and 23 moves. After the cascade A reloads into the saved game with 23 moves.
4. B remains open with the update offer. Apply there: 23 moves and all 56 tile values match A exactly.
5. Stop the server: manual check reports a network error. Reload offline and continue: same 23 moves and same board.
6. Restore server: manual check reports current version again.
7. Build another release and leave the settings window open: periodic background checking changes it to “Новая версия готова” / “Обновить игру” without a manual check.

Limits: browser tests used desktop Chrome (mobile viewport for UI), not physical Android/iOS. Background/suspended apps can only check once the OS gives them execution time; returning to the app triggers a check. Concurrent divergent play in multiple tabs does not merge campaigns: detected unsaved conflicts block saving/updating and warn, rather than silently choosing a losing snapshot.
