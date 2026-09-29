# Level 1 Visual Recovery Log

## Task 1 — QA baseline

- Added `visualRevision: level1-visual-r1` to the runtime QA sample contract.
- Targeted verification: `node --test tests/level1-qa-harness.test.mjs tests/level1-render-contracts.test.mjs` — PASS (9/9).
- Added `scripts/capture-level1-heroes.mjs` for deterministic Chromium hero-zone captures.
