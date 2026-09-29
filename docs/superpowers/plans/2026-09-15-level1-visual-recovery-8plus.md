# Sky Aegis Level 1 Visual Recovery 8+/10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the constructed Level 1 runtime from the current ~5.3/10 visual baseline to at least 8.0/10 against the authoritative blueprint while preserving gameplay, deterministic geography, camera behavior, surface semantics, mission anchors and mobile portrait output.

**Architecture:** Keep the existing Tiled → compiler → runtime geography pipeline and the corrected wide-world registration. Improve the world by strengthening authored relief/material metadata, modular landmark art, district composition and lighting/atmosphere passes. All acceptance images must come from the normal runtime renderer; the blueprint remains reference-only.

**Tech Stack:** JavaScript ES modules, Canvas 2D renderer, WebGL water with Canvas fallback, Tiled JSON/TMJ, Node test runner, existing static asset pipeline and local HTTP/PWA launcher.

**Spec:** `docs/superpowers/specs/2026-09-15-level1-visual-recovery-8plus-design.md`

## Global Constraints

- `dist/maps/coastal-intercept.tmj` remains the authoritative Level 1 map.
- Do not package, request or render the blueprint or flattened district screenshots as runtime scenery.
- Preserve the existing uniform reference registration and wide-world camera unless a measured local correction is necessary.
- Preserve ground/naval surface semantics, encounter/rescue/boss anchors, road routing and bridge underpass behavior.
- Keep 720 × 1280 logical gameplay and validate 1080 × 1920 backing output.
- A hero zone cannot pass if it scores below 8.0/10 against its matching blueprint crop.
- Final packaging is blocked until the weighted visual score is >= 8.0, all automated tests pass, the release build succeeds and reference-picture absence checks pass.
- Because this supplied project is not a Git repository, replace commit steps with an append-only entry in `verification/level1/visual-recovery-log.md`.

---

### Task 1: Establish a reproducible visual-baseline harness

**Files:**
- Modify: `dist/src/qa.js`
- Modify: `dist/qa.html`
- Create: `scripts/capture-level1-heroes.mjs`
- Create: `verification/level1/visual-recovery-scorecard.md`
- Test: `tests/level1-qa-harness.test.mjs`
- Test: `tests/level1-render-contracts.test.mjs`

**Interfaces:**
- Consumes: `window.__LEVEL1_QA__.selectCheckpoint(id, options)` and `window.__LEVEL1_QA__.sample()`.
- Produces: deterministic PNG captures for `bridge-gateway`, `civil-harbour`, `naval-yard`, `lower-dam`, `citadel-basin`, with center/left/right camera views where applicable.

- [ ] **Step 1: Add a failing QA test for hero capture metadata**

Add to `tests/level1-qa-harness.test.mjs` an assertion that `sample()` exposes:
`build`, `checkpointId`, `cameraX`, `scrollDistance`, `backingWidth`, `backingHeight`, `quality`, `waterBackend`, `visibleFeatureIds`, and `visualRevision`.

- [ ] **Step 2: Run the QA test and verify RED**

Run:
`node --test tests/level1-qa-harness.test.mjs`

Expected: FAIL because `visualRevision` is absent.

- [ ] **Step 3: Add `visualRevision` to the QA sample contract**

Set `visualRevision` to a stable Level 1 visual revision string, initially `level1-visual-r1`, returned from the same runtime scene used for gameplay.

- [ ] **Step 4: Add the capture script**

Create `scripts/capture-level1-heroes.mjs` that:
1. starts/uses the served `dist/` build,
2. launches available Chromium/Chrome through Playwright/Puppeteer if installed,
3. waits on `__LEVEL1_QA__.ready`,
4. selects each hero checkpoint in quiet mode,
5. captures center and supported pan-extreme views at 1080 × 1920,
6. writes files under `verification/level1/runtime/`,
7. writes matching `sample()` JSON beside each PNG.

If no browser driver exists, exit with a clear `CAPTURE_UNAVAILABLE` code/message and preserve static renderer review as `NOT VERIFIED`.

- [ ] **Step 5: Verify GREEN**

Run:
`node --test tests/level1-qa-harness.test.mjs tests/level1-render-contracts.test.mjs`

Expected: PASS.

- [ ] **Step 6: Record baseline**

Write `verification/level1/visual-recovery-scorecard.md` with the current audited scores and the 8.0 targets from the approved spec.

- [ ] **Step 7: Log task completion**

Append Task 1 result, test command and capture availability to `verification/level1/visual-recovery-log.md`.

---

### Task 2: Rebuild terrain relief and material depth

**Files:**
- Modify: `dist/maps/coastal-intercept.tmj`
- Modify: `scripts/compile-geography.mjs`
- Modify: `scripts/lib/geography-validator.mjs`
- Modify: `dist/src/game/render/ReliefRenderer.js`
- Modify: `dist/src/game/render/TerrainDetailRenderer.js`
- Modify: `dist/src/game/render/CoastalScene.js`
- Create/modify assets: `dist/art/level1/raster/`
- Test: `tests/geography-validator.test.mjs`
- Test: `tests/level1-render-contracts.test.mjs`
- Test: `tests/level1-visual-richness.test.mjs`

**Interfaces:**
- Consumes: compiled `reliefZones`, `materialZones`, `vegetationZones`, `shadowCasters`.
- Produces: irregular cliff faces/rims/shelves, deterministic world-anchored material variation, slope/elevation-aware vegetation and terrain cast shadows.

- [ ] **Step 1: Write failing richness tests**

Require:
- at least two relief layers in `bridge-gateway`, `river-canyon`, `lower-dam`, `fortress-approach`, `citadel-basin`;
- no relief zone may be a simple 3-point triangle;
- hero relief zones must include a `reliefKind` of `face`, `shelf` or `rim`;
- hero material zones must include at least two material families per district.

- [ ] **Step 2: Run targeted tests and verify RED**

Run:
`node --test tests/level1-visual-richness.test.mjs tests/geography-validator.test.mjs`

Expected: FAIL on missing relief complexity/material diversity where the current map is insufficient.

- [ ] **Step 3: Extend TMJ visual metadata**

Author irregular relief polygons and material/vegetation/shadow zones around:
- bridge banks,
- harbour inland edges,
- canyon walls,
- dam abutments,
- frozen approach,
- citadel basin.

Use world-space polygons aligned with the existing blueprint registration.

- [ ] **Step 4: Strengthen validator/compiler**

Reject:
- relief polygons with fewer than four distinct vertices in hero districts,
- invalid `reliefKind`,
- out-of-bounds relief/material zones,
- hero zones without district/material association.

Compile stable IDs and visual metadata into `coastalGeographyData.js`.

- [ ] **Step 5: Improve relief renderer**

Render three focused passes:
- `shadow`: projected cast/contact shadows,
- `face`: fractured rock/concrete faces with restrained material variation,
- `rim`: broken ledges/shelves with snow/vegetation where authored.

Use deterministic seeded micro-detail; never `Math.random()` in rendering.

- [ ] **Step 6: Improve material and vegetation passes**

Make vegetation follow authored density zones and leave roads/shore contacts readable. Break texture repetition with deterministic masks/overlays rather than giant repeated tiles.

- [ ] **Step 7: Verify GREEN**

Run:
`node scripts/compile-geography.mjs`
`node --test tests/geography-validator.test.mjs tests/level1-render-contracts.test.mjs tests/level1-visual-richness.test.mjs`

Expected: PASS.

- [ ] **Step 8: Capture/review hero terrain**

Capture or statically render bridge, canyon/dam and citadel terrain. Reject obvious triangular/pyramidal repetition, flat slabs or texture swimming.

- [ ] **Step 9: Log task completion**

Append commands, results and visual notes to `verification/level1/visual-recovery-log.md`.

---

### Task 3: Bridge Gateway 8/10 hero pass

**Files:**
- Modify: `dist/maps/coastal-intercept.tmj`
- Modify: `dist/src/game/content/level1Art.js`
- Modify: `dist/src/game/render/AuthoredStructures.js`
- Modify: `dist/src/game/render/CoastalScene.js`
- Modify/create: `dist/art/level1/raster/gateway-*.png`
- Modify/create: `dist/art/level1/raster/coastal-watchtower.png`
- Test: `tests/level1-surface-domains.test.mjs`
- Test: `tests/level1-visual-richness.test.mjs`
- Test: `tests/level1-reference-fidelity.test.mjs`

**Interfaces:**
- Consumes: bridge geometry, corrected bank relief, road approaches and `level1Art` registry.
- Produces: fortified bridge composition with two bank-integrated keeps, layered terraces/abutments, visible supports, beaches/shallows and compact downstream watch-fort.

- [ ] **Step 1: Write failing composition tests**

Require:
- two gateway keeps framing opposite banks,
- at least four gateway terraces,
- visible support modules below deck,
- bridge gateway has authored beach/shallow contact metadata on both banks,
- major bridge art casts shadows and preserves source aspect ratio.

- [ ] **Step 2: Verify RED**

Run:
`node --test tests/level1-visual-richness.test.mjs tests/level1-reference-fidelity.test.mjs`

Expected: FAIL on any remaining missing bridge composition requirements.

- [ ] **Step 3: Author/upgrade bridge assets**

Replace simplistic tower/support sprites with high-resolution fortified stone/concrete modules matching the blueprint silhouette: heavy bases, narrow upper towers, visible deck connection and directional light.

- [ ] **Step 4: Recompose the bridge scene in TMJ**

Place the upgraded assets so both banks frame the bridge. Add/adjust local terraces, retaining walls, beach pockets, reef shelves and rock stacks without changing the bridge’s gameplay span or road connectivity.

- [ ] **Step 5: Strengthen bridge shadows/occlusion**

Ensure deck thickness, supports, bank structures and terrain cast coherent shadows while the underpass remains visually and semantically open to naval units.

- [ ] **Step 6: Verify GREEN**

Run:
`node scripts/compile-geography.mjs`
`node --test tests/level1-surface-domains.test.mjs tests/level1-visual-richness.test.mjs tests/level1-reference-fidelity.test.mjs`

Expected: PASS.

- [ ] **Step 7: Visual gate**

Capture center/left/right bridge views and compare to `reference/LEVEL1_BLUEPRINT.png`. Score geography, architecture, relief, materials and shadows. Continue corrections until Bridge Gateway >= 8.0/10.

- [ ] **Step 8: Log task completion**

Append score/evidence paths to the recovery log.

---

### Task 4: Civil, industrial and naval harbour 8/10 pass

**Files:**
- Modify: `dist/maps/coastal-intercept.tmj`
- Modify: `dist/src/game/content/level1Art.js`
- Modify: `dist/src/game/render/AuthoredStructures.js`
- Modify: `dist/src/game/render/ShoreEffects.js`
- Create/modify harbour assets under `dist/art/level1/raster/`
- Test: `tests/geography-port-layout.test.mjs`
- Test: `tests/level1-visual-richness.test.mjs`
- Test: `tests/level1-reference-fidelity.test.mjs`

**Interfaces:**
- Consumes: corrected port basins, quay-edge modules, roads, water regions and authored art registry.
- Produces: connected civil marina, industrial quay system and asymmetrical naval yard with coherent edges, ramps, service areas, buildings, cranes, ships and shoreline treatment.

- [ ] **Step 1: Write failing harbour-density tests**

Require per blueprint-facing district:
- civil: >= 12 connected edge/pier/ramp modules and >= 10 structures,
- industrial: >= 16 service/edge modules and >= 12 structures,
- naval: >= 18 service/edge modules and >= 14 structures,
- west/east layouts remain asymmetric,
- at least two elevation/edge families per heavy harbour district.

- [ ] **Step 2: Verify RED**

Run:
`node --test tests/geography-port-layout.test.mjs tests/level1-visual-richness.test.mjs`

Expected: FAIL where current density/connectivity is below the new floor.

- [ ] **Step 3: Recompose civil harbour**

Add varied marina fingers, small buildings, retaining walls, greenery and local shallow-water transitions. Keep scale intimate.

- [ ] **Step 4: Recompose industrial/naval districts**

Add segmented quays, ramps, service yards, tanks/utilities, cranes, radar/helipads, distinct ship berths and road connections. Avoid mirrored repetition.

- [ ] **Step 5: Improve quay contact**

Use dedicated quay water contact, subtle wakes/spray around vessels and shadowed dock edges.

- [ ] **Step 6: Verify GREEN**

Run:
`node scripts/compile-geography.mjs`
`node --test tests/geography-port-layout.test.mjs tests/level1-visual-richness.test.mjs tests/level1-reference-fidelity.test.mjs`

Expected: PASS.

- [ ] **Step 7: Visual gate**

Capture civil and naval views. Continue corrections until Civil/Naval Harbour >= 8.0/10.

- [ ] **Step 8: Log task completion**

Append score/evidence paths to the recovery log.

---

### Task 5: Canyon, dam, citadel and atmosphere recovery

**Files:**
- Modify: `dist/maps/coastal-intercept.tmj`
- Modify: `dist/src/game/content/level1Art.js`
- Modify: `dist/src/game/render/CoastalScene.js`
- Modify: `dist/src/game/render/Atmosphere.js`
- Modify: `dist/src/game/render/ShoreEffects.js`
- Create/modify: `dist/art/level1/raster/dam-*.png`
- Create/modify: `dist/art/level1/raster/fortress-*.png`
- Create/modify: `dist/art/level1/raster/canyon-*.png`
- Test: `tests/level1-visual-richness.test.mjs`
- Test: `tests/level1-reference-fidelity.test.mjs`
- Test: `tests/environment-animation.test.mjs`

**Interfaces:**
- Consumes: hero relief/material zones and modular landmark registry.
- Produces: canyon-embedded dam, mountain-integrated citadel/frozen basin and coherent depth-based atmosphere.

- [ ] **Step 1: Write failing hero-composition tests**

Require:
- dam has two abutments, service galleries and at least six face/support divisions,
- canyon has multiple retaining walls and at least three waterfall/spill sources,
- citadel has gate, two wings, >=2 towers, >=2 buttresses, >=2 snow terraces and secondary defensive structures,
- atmosphere defines separate low/high/shadow passes keyed to district/depth.

- [ ] **Step 2: Verify RED**

Run:
`node --test tests/level1-visual-richness.test.mjs tests/environment-animation.test.mjs`

Expected: FAIL where composition count/depth behavior is insufficient.

- [ ] **Step 3: Rebuild canyon/dam composition**

Strengthen vertical walls, road shelves/tunnels, waterfall sources, dam abutments, face divisions, toe/service elements and reservoir/downstream separation.

- [ ] **Step 4: Rebuild citadel/frozen basin composition**

Broaden fortress wings/terraces, integrate mountain buttresses, add secondary towers/defensive silhouettes, irregular ice and snow-covered rock masses while preserving boss arena visibility.

- [ ] **Step 5: Improve atmosphere**

Add depth-based haze/mist and restrained high clouds/shadows. Keep combat readability and avoid opaque blobs.

- [ ] **Step 6: Verify GREEN**

Run:
`node scripts/compile-geography.mjs`
`node --test tests/level1-visual-richness.test.mjs tests/level1-reference-fidelity.test.mjs tests/environment-animation.test.mjs`

Expected: PASS.

- [ ] **Step 7: Visual gate**

Continue corrections until Canyon/Dam >= 8.0 and Citadel >= 8.0.

- [ ] **Step 8: Log task completion**

Append score/evidence paths to the recovery log.

---

### Task 6: Final scoring, release verification and package

**Files:**
- Modify: `verification/level1/visual-recovery-scorecard.md`
- Modify: `verification/level1/visual-recovery-log.md`
- Modify: `RELEASE_REPORT.md`
- Modify: `VERIFICATION.txt`
- Modify: `package.json` version only if release is accepted
- Generated: service worker/manifest via `scripts/build-release.mjs`
- Package: `/mnt/data/Sky_Aegis_Level1_VISUAL_8PLUS.zip`

**Interfaces:**
- Consumes: all hero captures, test results and build output.
- Produces: weighted final score, accepted/rejected release status and downloadable ZIP.

- [ ] **Step 1: Run full automated verification**

Run:
`npm test`

Required: 0 failures.

- [ ] **Step 2: Run production build**

Run:
`node scripts/build-release.mjs`

Required: exit code 0.

- [ ] **Step 3: Verify blueprint absence**

Run:
`node --test tests/visual-reference-runtime.test.mjs`

Required: PASS.

- [ ] **Step 4: Capture final runtime hero views**

Use `scripts/capture-level1-heroes.mjs`. If browser capture remains unavailable, mark final visual score `NOT VERIFIED` and do not claim 8/10.

- [ ] **Step 5: Score the release**

Complete the weighted score:
- geography/composition 20%,
- terrain relief 20%,
- landmark architecture 20%,
- harbour/density 10%,
- materials 10%,
- lighting/shadows/atmosphere 10%,
- shoreline/water 5%,
- roads/tunnels/integration 5%.

Required:
- weighted total >= 8.0,
- Bridge >= 8.0,
- Harbour >= 8.0,
- Canyon/Dam >= 8.0,
- Citadel >= 8.0.

- [ ] **Step 6: Package only on accepted score**

Create `/mnt/data/Sky_Aegis_Level1_VISUAL_8PLUS.zip` from the verified project. Include source, runnable `dist`, verification logs, scorecard and capture evidence. Exclude temporary browser/cache directories.

- [ ] **Step 7: Verify ZIP integrity**

Run:
`unzip -t /mnt/data/Sky_Aegis_Level1_VISUAL_8PLUS.zip`

Required: no errors.

- [ ] **Step 8: Report exact status**

If any visual gate is unverified or below 8.0, report the real score and remaining defects and do not label the release “8+/10”.
