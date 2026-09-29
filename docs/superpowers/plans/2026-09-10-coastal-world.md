# Coastal world rebuild implementation plan

> Execute inline; preserve the supplied archive and review the final playable output.

**Goal:** Replace prototype scenery and attack presentation while preserving the game loop.
**Architecture:** Independent authored scene, combat presentation and encounter timeline modules compose the existing simulation.
**Tech Stack:** Native browser ES modules, Canvas2D compositing of baked 2.5D assets, Node built-in tests.
**Spec:** docs/superpowers/specs/2026-09-10-coastal-world-design.md

## Global constraints
- World 1152 wide, combat viewport 720 x 1280; never stretch.
- Preserve all nine aircraft and ten enemy families.
- Ship runnable download with no package install required for play.
- The exact packaged code must be inspected visually; physical phones remain unverified.

## Task 1: Authored world
- [x] Replace Environment.js with explicit module placements, footprint/socket metadata, non-repeating world projection and surface lookup.
- [x] New CoastalScene.js consumes module descriptors and draws moving water, silhouettes, material sprites, foam and raised foreground elements.
- [x] Integrate WorldRenderer, remove old rectangular terrain/scenery drawing path.
- [x] Verify scroll transform and socket registration using node --test tests/world.test.mjs.

## Task 2: Encounters
- [x] EnemySystem.js uses cubic paths and timed states; WeaponSystem.js consumes attack state and emits staggered family patterns.
- [x] MissionDirector.js anchors props/rescues/ground enemies to shared scroll; stop at carrier and miniboss.
- [x] Verify telegraph before fire, delayed pattern emission, death cancellation, finite positions and distinct trajectories.

## Task 3: Presentation and framing
- [x] New CombatPresentation.js composes event illumination, animated debris, smoke and trails with existing sprites.
- [x] Extend canvas world scenery vertically and retain logical player bounds; readable mobile HUD.
- [x] Verify 9:16 and tall-phone frame transforms, captured gameplay and assets; exercise mission completion in an explicitly injected simulation test.

## Task 4: Package
- [x] Refresh version, service worker and asset manifest; retain portable start scripts.
- [x] Test the extracted archive and write a candid verification record.
- [x] Complete exact-ZIP visual captures and document the inspected scope. Browser connection recovered; physical/commercial certification remains outside the evidence.
- [x] Prepare a review checkpoint with the open gate explicitly documented.
