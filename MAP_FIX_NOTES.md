# Sky Aegis Level 1 — Portrait Map Composition Fix

Date: 2026-09-28

## Problem fixed

The authored Level 1 geography was compiled to an approximately 2605.8-unit-wide world while the portrait gameplay viewport is 720 units wide. At runtime this exposed only about 28% of the authored width at once, pushing opposite banks, harbour structures, bridge architecture and landmarks outside the useful gameplay crop. The result looked like oversized empty water corridors and disconnected scenery.

## Runtime projection

The authored source geography remains intact. The runtime compiler now projects the horizontal axis into a 1152-unit-wide portrait gameplay world while preserving the existing vertical scale and mission timeline.

- Geography version: 9
- Runtime world width: 1152
- Portrait viewport: 720
- Horizontal camera travel retained: 432 world units
- 15 districts retained
- 25 road nodes retained
- 68 semantic sockets retained

The projection is applied consistently to terrain polygons, roads, bridges, sockets, atmosphere zones, shadow offsets, landmark centers and other authored X coordinates. Hero structure widths are intentionally not squeezed because their visual sizes were already appropriate for the portrait gameplay scale.

## Renderer corrections

- Relief-side classification now uses the actual gameplay world centre instead of the former 2605-wide hardcoded threshold.
- Citadel composition X offsets scale to the current world width.
- Canyon waterfall positions scale to the current world width.
- Blueprint/world conversion now supports separate horizontal and vertical registration scales.

## Verification

`npm test`: 130/130 tests passed, 0 failures.

`node scripts/build-release.mjs`: passed.

Compiled geography output: 15 districts, 25 road nodes, 68 sockets.

Release cache: 357 entries, 306 art/map files hashed.
