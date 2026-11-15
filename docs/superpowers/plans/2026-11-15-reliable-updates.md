# Reliable PWA updates

Goal: discover and prepare releases while tabs remain open, apply only on player request after a settled, durable save.
Architecture: attach to an existing registration before network work; deterministic content hashes permit verified reuse of cached files and atomic new release installation. Observable, retryable downloads; one application check at a time. Old tabs do not reload or overwrite newer saves on activation.

- [x] Reproduce delayed registration and installation failures with tests; attach watchers without waiting for network/ready.
- [x] Build deterministic release hashes; reuse verified files, bounded concurrency/retries, fail closed on incomplete downloads; preserve active tab caches.
- [x] Wire shared check state and progress, safe apply, resume/network checks, and deferred cross-tab synchronization.
- [x] Test two live browser tabs across releases, running turn, offline/retry and persistence; review; publication and public-file verification follow these checks.

Constraints: no clearing localStorage, no automatic skipWaiting/reload, no game rule changes. Physical device testing unavailable; report this honestly.
