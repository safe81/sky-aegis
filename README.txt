SKY AEGIS — LEVEL 1 BLUEPRINT RECONSTRUCTION — v1.6.0

Run START_GAME.bat on Windows, or run `node scripts/serve.mjs dist 4173` and open the URL printed by the server.

This build replaces the old stretched Level 1 picture background with authored Tiled geography, live water, traced islands/mainland banks, modular architecture, explicit semantic anchors and deterministic QA checkpoints.

The authoritative blueprint remains reference-only outside dist/. The runtime does not package or draw it.

Verification status:
- Automated Node test suite: verified by the release verification report.
- Geography compiler/validator: verified by the release build.
- Local server startup/fallback: covered by automated tests.
- Headless Chromium visual capture in this sandbox: NOT VERIFIED; Chromium did not complete initialization reliably here.
- Physical iPhone/Android performance and final visual-equivalence review: NOT VERIFIED and must be completed on real devices before claiming production visual acceptance.
