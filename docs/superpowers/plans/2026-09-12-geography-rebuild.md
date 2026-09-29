# Coastal Intercept Geography Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace encounter-by-encounter scenery collage with one continuous, plausible authored coastal geography whose roads, shorelines, harbour, bridges, docks, military districts and gameplay sockets remain topologically consistent for the entire mission.

**Architecture:** A data-only master geography defines districts, land polygons, shorelines, roads, concrete aprons, docks, bridge placements, landmarks and semantic sockets in world coordinates. `Environment` becomes the query/model layer and `CoastalScene` becomes a chunked renderer of that one master map; chunks are only a performance detail and never define geography. Existing art textures/modules are retained as materials/landmarks.

**Tech Stack:** Vanilla ES modules, Canvas 2D, Node test runner, existing production PNG materials, Tiled-compatible JSON source representation for future editing.

**Spec:** `Sky_Force_Successor_Audit_and_Build_Plan(2).md`, especially sections 4, 5, 7, 15 and 16.

## Global Constraints

- Preserve the fixed 720x1280 logical gameplay system and existing simulation/combat behaviour.
- Change geography only in this package; no aircraft, enemy attack, VFX or UI redesign.
- World geography must remain deterministic for a fixed mission seed.
- No encounter may create or move terrain geometry.
- Roads must be continuous polylines and bridges must connect road segments on both ends.
- Ground sockets must lie on land/concrete/road; naval sockets must lie in water.
- Use existing art assets as materials/landmarks; do not use a screenshot as the map.
- Chunking is render-only and must not introduce seams or topology changes.

---

### Task 1: Master geography data and invariants

**Files:**
- Create: `dist/src/game/content/coastalGeography.js`
- Create: `dist/maps/coastal-intercept.tmj`
- Create: `tests/geography.test.mjs`

**Interfaces:**
- Produces: `COASTAL_GEOGRAPHY`, `districtAtWorldY(y)`, `surfaceAtWorldPoint(x,y)`, `semanticSockets`.

- [ ] Write failing tests proving one continuous mainland shoreline, road continuity, bridge endpoint adjacency, district ordering, socket surface validity and no duplicate semantic IDs.
- [ ] Run `node --test tests/geography.test.mjs` and confirm RED.
- [ ] Implement authored geography data and helpers.
- [ ] Run the geography test and confirm GREEN.

### Task 2: Replace encounter-owned Environment model

**Files:**
- Modify: `dist/src/game/render/Environment.js`
- Test: `tests/world.test.mjs`, `tests/geography.test.mjs`

**Interfaces:**
- Consumes: `COASTAL_GEOGRAPHY`.
- Produces: visibility queries for polygons, roads, landmarks, bridges and semantic sockets; `surfaceAtWorldPoint` delegation.

- [ ] Add failing assertions that terrain inventory is independent of mission encounter count and that scroll only transforms Y.
- [ ] Run tests and confirm RED.
- [ ] Replace `SCENES`/per-encounter modules with master-map queries.
- [ ] Run tests and confirm GREEN.

### Task 3: Render authored topology with existing materials

**Files:**
- Modify: `dist/src/game/render/CoastalScene.js`
- Modify: `dist/src/game/render/WorldRenderer.js` only if required for preload/material keys.
- Test: `tests/geography-render.test.mjs`

**Interfaces:**
- Consumes: visible land polygons, concrete zones, road polylines, docks, bridges and landmarks.
- Produces: chunked terrain canvases that tile seamlessly and preserve render order.

- [ ] Write source-level regression tests requiring polygon clipping/pattern fills, road polyline rendering and bridge/landmark rendering from master geography.
- [ ] Run and confirm RED.
- [ ] Implement chunk rendering using existing `land-tile`, `asphalt-tile`, `concrete-tile`, `dock-metal-tile`, rock/foam/prop assets and selected module art.
- [ ] Run and confirm GREEN.

### Task 4: Surface-aware mission sockets without changing combat

**Files:**
- Modify: `dist/src/game/render/Environment.js`
- Modify only if necessary: `dist/src/game/missions/MissionDirector.js`, `dist/src/game/enemies/EnemySystem.js`
- Test: `tests/geography.test.mjs`, `tests/encounters.test.mjs`

**Interfaces:**
- Produces semantic socket lookup by role: `road_vehicle`, `aa_pad`, `missile_pad`, `dock`, `water_lane`, `rescue_zone`, `boss_anchor`.

- [ ] Write failing tests for semantic socket availability at mission beats.
- [ ] Confirm RED.
- [ ] Route existing scenery-aware placement to semantic sockets while retaining event timing/families.
- [ ] Confirm GREEN with encounter suite.

### Task 5: Release verification for geography-only build

**Files:**
- Modify: `package.json`, `scripts/build-release.mjs`, `RELEASE_REPORT.md`, `VERIFICATION.txt`, version strings/service worker.

**Interfaces:**
- Produces: v1.2.0 geography-only release package.

- [ ] Run complete `npm test`.
- [ ] Run syntax checks for modified JS modules.
- [ ] Serve build over local HTTP and verify core resources return 200.
- [ ] Capture quiet-map evidence at multiple mission positions if browser automation is available.
- [ ] Package exact build and re-run ZIP integrity/extraction checks.
