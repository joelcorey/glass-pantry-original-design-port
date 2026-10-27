# Verification status

Production build: passed. See `build.log`.

Compiled App Router handlers: tested directly without opening network sockets. See `route-results.json` and `route-check.log`.

Screenshot comparison: **not completed**. No reference, port, or difference screenshots are claimed. Local HTTP listeners fail with `EPERM: operation not permitted`; Chromium fails with `setsockopt: Operation not permitted` and `SIGTRAP`. The available computer-use browser also reports `CUA_REPL_ENABLED_SURFACES is required`. See `browser-attempt.log`.

The repeatable comparison runner is `scripts/verify.mjs`, using unmodified response bytes from the original crawl as the reference. Planned sizes: desktop 1440×1000, tablet 768×1024, mobile 390×844. These sizes have **not** been visually validated.

Image URL correction: the running user-started HTTP server is reachable through the approved curl command. All 73 homepage src/srcset images return 200 with original bytes, and localhost/LAN/HTTPS proxy regression checks pass. See `image-http-results.json` and `image-routing-results.json`. Full browser screenshot verification remains uncompleted.
