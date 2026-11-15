# Comfortable first update
User authorized implementation of the proposed update: softer quieter stock effects, responsive swipes, direct helpers without Apply, twelve varied levels including plates, then hands-on playtesting. Keep PWA/offline, existing artwork, progress, music and update flow.

Keep current JS engine and renderer (approved approach); a native rewrite or new engine is unnecessary. First twelve level definitions are authored explicitly, one/two goals at a time. Plate goals are fixed cells: removing food there clears the plate once; plates do not fall. Helpers clear plates too. Existing games retain serialized goals, board and moves. Later levels remain available.

Gesture: threshold relative to cell size; ambiguous diagonals wait for direction; food follows finger along locked axis; release performs one adjacent swap; cancellation/outside release does not spend. Retain two-tap and keyboard access. Helper button toggles selection; touch field previews under finger and release applies once, release outside cancels target, no confirmation. Buttons remain visible.

Audio: reuse licensed Kenney recordings, soften harsh high frequencies, quiet master effects level with saved slider. Remove per-selection, invalid and landing sounds; one short sound per cascade with overlap suppression. Music unchanged.

First twelve: food / food / two foods / central plates / food / plates+food / food / two foods / plates / easier food / plates+food / plates+food. No timers, currencies, daily streaks or additional mechanics.
