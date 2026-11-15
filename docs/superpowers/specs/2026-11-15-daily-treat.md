# Daily treat and gentle progression
User request: add one short daily level and a postcard collection; no penalties for missed days. Follow-up: regular game is too easy. User chose gentle progression with rare losses.

Keep the PWA and existing match engine. Alternatives considered: adding daily rewards to the campaign would overwrite the current party; a separate daily save is chosen to preserve it. Server calendars, streaks and expiring rewards are unnecessary for this personal offline game.

Daily follows local device calendar (YYYY-MM-DD), with deterministic initial layout/refills/retry for that date. 16 moves, one simple food or compact plates objective, familiar helpers. Unlimited retries. An unfinished previous day's treat remains playable; starting today's asks before replacing it. Day rollover never interrupts a running party. Reopening a won day never grants a duplicate. Winning records the postcard atomically with settled game before animations. Daily mode never unlocks campaign levels or changes campaign score/board.

Cards are awarded in sequence, not tied to unrepeatable calendar dates: skipped days lose nothing. Use twelve illustrated motifs from existing food artwork, warm paper backgrounds and short messages; subsequent cards are dated editions. Collection paginates four cards, opens each at readable size, empty state links to daily game. Export/import includes collection and both saves. No timers, countdowns, streaks, notifications or punishment language.

Gentle campaign progression: keep first four introductions easy. Increase food goals and spatial spread of plates later, modestly lower moves on chapter finales. Cap growth in later chapters so high levels remain feasible. Earn at most one of each helper per turn on new games (previous saved games retain old reward behavior via an absent rule field). Keep initial helper charges and no-move-cost use. Existing active campaigns keep goals, moves and board.

Verify day rollover, deterministic continuation, repeated wins, migration, both saved slots, offline, mobile fitting, reward/collection, and seeded balance diagnostics with greedy and less deliberate policies. Publish to existing GitHub Pages.
