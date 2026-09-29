# Sky Aegis Level 1 — Visual Recovery to 8+/10 Design

## Decision

Use **Option B: full hero-environment pass on the existing corrected world**.

The current geography, camera, gameplay anchors, Tiled authoring pipeline and runtime semantics remain the foundation. The visual layer is rebuilt district-by-district until the weighted visual score is at least 8.0/10 against the authoritative Level 1 blueprint. The blueprint remains a reference-only asset and must never be packaged or rendered as a background.

## Current audit baseline

The current runtime is approximately **5.3/10 overall** against the blueprint.

| Area | Current score | Required score |
| --- | ---: | ---: |
| Overall geography / route | 7.5 | 8.5 |
| Bridge gateway | 4.5 | 8.0 |
| Civil / naval harbour | 4.5 | 8.0 |
| Canyon / dam | 5.0 | 8.0 |
| Citadel architecture | 6.0 | 8.5 |
| Terrain relief / mountains | 4.0 | 8.0 |
| Materials / surface detail | 5.0 | 8.0 |
| Vegetation | 4.5 | 7.5 |
| Water | 6.0 | 8.0 |
| Shoreline / reefs / beaches | 4.5 | 8.0 |
| Roads / tunnels | 6.0 | 8.0 |
| Shadows / height perception | 4.5 | 8.0 |
| Lighting | 5.0 | 8.0 |
| Atmosphere | 4.5 | 8.0 |
| Detail density | 4.5 | 8.0 |
| Visual cohesion | 5.5 | 8.0 |

The principal deficit is not missing gameplay systems. It is insufficient relief, landmark integration, material variation, scene density and lighting depth.

## Goal

Raise Level 1 to a **weighted visual score of at least 8.0/10** against the blueprint while preserving gameplay, deterministic geography, mission anchors, collision domains, camera behavior, mobile portrait layout and the existing authored-map pipeline.

The implementation should strive to exceed the blueprint where doing so adds production-quality detail without changing the reference composition, landmark identity, silhouette or route.

## Non-negotiable constraints

1. Keep `dist/maps/coastal-intercept.tmj` as the authoritative Level 1 map.
2. Keep the existing reference registration and corrected wide-world camera model unless a measured visual mismatch proves a local geometry correction is required.
3. Do not use the blueprint, crops of it, or flattened district screenshots as runtime scenery.
4. Keep the normal runtime renderer as the source of acceptance screenshots.
5. Preserve surface domains, road/naval routes, encounter anchors, rescue anchors, boss anchors and bridge underpass semantics.
6. Maintain 720 × 1280 logical gameplay coordinates and validate 1080 × 1920 backing output.
7. Reuse current Level 1 art only when it meets the new visual contract. Replace weak assets rather than preserving them for sunk-cost reasons.
8. Do not add random visual clutter to inflate density. Every large structure and landform must have a plausible relationship to roads, shorelines, elevation or gameplay.
9. Do not move on from a hero district until its corresponding runtime crop scores at least 8/10 in the district-specific review.
10. Final packaging is blocked until the weighted score is at least 8.0 and all automated tests/build checks pass.

## Visual scoring contract

Use this weighted score for release acceptance:

| Dimension | Weight |
| --- | ---: |
| Geography / composition fidelity | 20% |
| Terrain relief / mountain quality | 20% |
| Landmark architecture | 20% |
| Harbour / district density | 10% |
| Materials / texture richness | 10% |
| Lighting / shadows / atmosphere | 10% |
| Shoreline / water integration | 5% |
| Roads / tunnels / structural integration | 5% |

Each dimension is scored 0–10 from runtime captures against matching blueprint crops. The final score is the weighted mean. No weighted total can pass if Bridge Gateway, Harbour, Dam/Canyon or Citadel scores below 7.5 individually.

## Architecture

The recovery pass adds richer authored visual data and rendering behavior without replacing the existing map/data pipeline.

### Map/data layer

`coastal-intercept.tmj` continues to define:
- land/water silhouettes,
- districts,
- roads,
- bridge geometry,
- water bodies,
- shoreline metadata,
- art instances,
- gameplay anchors,
- surface semantics.

Add only the metadata needed to express:
- relief zones,
- cliff feet and rims,
- material regions,
- snow coverage zones,
- vegetation-density zones,
- major shadow casters,
- landmark-support geometry,
- harbour edge families,
- waterfall/spill sources.

### Runtime art layer

`level1Art.js` remains the registry for modular assets. The pass adds:
- cliff/ledge modules,
- retaining walls,
- bridge abutment/tower/support modules,
- harbour quay/edge/ramp modules,
- industrial/naval density modules,
- dam side/abutment/spill modules,
- citadel wall/terrace/mountain-integration modules,
- terrain decals and material overlays.

Large landmark artwork may use high-resolution raster assets derived from editable masters, but must remain modular enough that terrain, water and dynamic effects remain live.

### Rendering layer

The rendering sequence remains layered and should be strengthened rather than replaced:

1. live water base,
2. seabed/shallow/reef contribution,
3. terrain fill and material regions,
4. cliff faces / ledges / retaining walls,
5. shoreline contact and surf,
6. roads, quays and ground infrastructure,
7. ground shadows,
8. ground structures and props,
9. elevated structures and bridge elements,
10. surface targets and vehicles,
11. low atmosphere,
12. aircraft and combat,
13. high atmosphere and grading,
14. HUD.

The key change is that relief, shadows and material overlays become first-class scene components instead of decorative afterthoughts.

## Milestone structure

### Milestone 1 — Terrain + Bridge + Harbour recovery

This is the first implementation milestone and the highest-value visual pass.

#### Terrain system

Replace synthetic triangular or repeated mountain silhouettes with authored relief built from:
- irregular cliff feet,
- broken cliff rims,
- intermediate shelves,
- concave/convex face changes,
- rock outcrops,
- debris fans,
- ledge vegetation,
- slope-dependent vegetation,
- snow accumulation masks where appropriate.

Terrain should read as layered geology rather than a textured polygon.

Required files likely include:
- `dist/maps/coastal-intercept.tmj`
- `dist/src/game/render/CoastalScene.js`
- `dist/src/game/render/Environment.js`
- new focused relief renderer if `CoastalScene.js` would otherwise grow further
- `dist/art/level1/` relief/material assets
- `tests/level1-visual-richness.test.mjs`
- `tests/level1-render-contracts.test.mjs`
- geography tests affected by new metadata

#### Bridge gateway

Rebuild the bridge scene around the reference composition:
- substantial fortified towers/abutments,
- visible deck thickness and supports,
- terrain-integrated road approaches,
- retaining walls,
- cliff terraces,
- nearby rock stacks,
- beaches and shallow-water transitions,
- strong coherent cast shadows,
- navigable water below the clear span.

The bridge itself must not dominate an otherwise empty scene; both banks must create the monumental gateway effect visible in the blueprint.

Required files likely include:
- `coastal-intercept.tmj`
- `level1Art.js`
- `AuthoredStructures.js`
- Level 1 bridge/fortification assets
- `CoastalScene.js`
- bridge/surface-domain tests
- visual-richness tests

#### Civil / industrial / naval harbour

Replace the current “objects on flat concrete” presentation with a connected port composition.

Civil harbour:
- smaller-scale warm-roof building clusters,
- marina fingers,
- retaining walls,
- local greenery,
- shallow water and beach/sand transitions,
- small craft.

Industrial/naval:
- segmented quay edges,
- ramps and service roads,
- industrial halls and utility clusters,
- tanks and pipe/service connections,
- cranes with believable bases/reach,
- helipads/radar,
- distinct ship berths,
- elevation differences between water edge, apron and inland structures,
- dense but asymmetrical left/right composition.

Every major flat surface must have a visible purpose, boundary and connection.

Required files likely include:
- `coastal-intercept.tmj`
- `level1Art.js`
- `AuthoredStructures.js`
- harbour/quay/road assets
- `ShoreEffects.js`
- `CoastalScene.js`
- geography port-layout tests
- visual-richness tests

#### Milestone 1 acceptance

Capture from the normal game renderer:
- bridge gateway center, left and right,
- civil harbour center,
- naval yard center, left and right,
- one representative mountain/relief frame.

Milestone 1 passes only when:
- bridge gateway >= 8.0/10,
- civil/naval harbour >= 8.0/10,
- terrain relief >= 7.5/10,
- no regression in geography, routes, bridge surface semantics or camera panning,
- no blueprint-derived flattened scenery is packaged.

### Milestone 2 — Canyon + Dam recovery

Rebuild the canyon and dam as one integrated elevation composition.

Required visual behavior:
- river sits visibly below surrounding terrain,
- roads cut through or sit on supported shelves,
- tunnels emerge from believable rock masses,
- multiple cliff layers create depth,
- waterfalls have source, lip, falling body, impact mist and downstream relation,
- dam has crown, face, abutments, divisions, toe and service structures,
- reservoir reads as physically held above downstream river,
- dam-side mountains visually embed the landmark.

Acceptance:
- canyon/dam >= 8.0/10,
- water bodies remain semantically separated,
- no naval route crosses the dam,
- no exposed map edge at checkpoint views.

### Milestone 3 — Citadel + frozen basin recovery

Preserve the current recognizable citadel core but integrate it into the mountain basin.

Required work:
- broader side-wall composition,
- more defensive terraces,
- mountain-integrated side structures,
- better fortress approach,
- irregular snow-covered rock,
- shoreline ice/floes without stamp-grid repetition,
- secondary installations and defensive silhouettes,
- stronger basin framing and atmospheric separation.

Acceptance:
- citadel architecture >= 8.5/10,
- complete citadel scene >= 8.0/10,
- boss anchor remains valid and final camera framing stays inside map bounds.

### Milestone 4 — Whole-level material, light and atmosphere pass

Unify the completed districts.

Materials:
- reduce obvious texture tiling,
- add wear, cracks, dampness, sediment, road-edge damage, concrete variation and snow/rock transitions,
- preserve threat readability.

Lighting:
- consistent upper-left world key unless the visual contract is deliberately changed once,
- stronger contact and cast shadows,
- local light only where motivated,
- no bloom sheet hiding unfinished geometry.

Atmosphere:
- depth-based haze,
- low mist in canyon/reservoir zones,
- sparse high clouds,
- cloud shadows that remain world-anchored,
- reduced opacity near combat-critical threats.

Acceptance:
- materials >= 8.0,
- lighting/shadows/atmosphere >= 8.0,
- visual cohesion >= 8.0.

## Component boundaries

### `ReliefRenderer` (new if needed)

Purpose: draw cliff faces, rims, shelves and terrain-contact shadow geometry from compiled relief metadata.

Consumes:
- district ID,
- relief polygons/paths,
- material family,
- elevation,
- light direction,
- camera/scroll state.

Produces:
- static terrain relief pass,
- separate shadow pass,
- visual bounds for cache culling.

It must not own gameplay collision or modify map topology.

### `AuthoredStructures`

Purpose remains landmark/structure rendering.

Extend only for:
- instance variants,
- explicit render size/scale,
- shadow footprint,
- terrain integration hooks.

Do not move cliff/terrain generation into this module.

### `ShoreEffects`

Purpose remains animated boundary contact.

Extend for:
- beach foam,
- rock break,
- quay slap,
- ice edge,
- waterfall receiving splash.

It must not alter coastline silhouettes.

### `Atmosphere`

Purpose remains low/high atmospheric effects.

Extend for:
- depth layers,
- zone-based fog density,
- cloud shadows,
- canyon mist.

Atmosphere must never be used to hide low-detail geometry.

## Data flow

1. Tiled TMJ stores authoritative geometry and new visual metadata.
2. `compile-geography.mjs` validates and emits the new relief/material/landmark-support data.
3. `Environment.js` exposes immutable scene data and semantic queries.
4. `CoastalScene.js` requests visible static tiles and delegates relief/structure/shore/atmosphere rendering to focused modules.
5. Dynamic water/effects remain live and world-registered.
6. QA checkpoints position the same runtime renderer for comparison captures.
7. Visual review compares runtime crops with corresponding blueprint crops and records scores.

## Error handling / validation

Compilation must fail when:
- a relief zone has invalid or self-inconsistent points,
- a declared cliff rim has no associated district/material,
- a landmark support references a missing asset or instance,
- a shadow-caster has invalid bounds,
- a water-side shoreline declaration is invalid,
- a harbour quay/road connection terminates in water without a declared pier/bridge relation.

Runtime should fail soft for a missing decorative asset by recording it in QA diagnostics, but missing major landmark assets are release blockers.

## Testing strategy

### Automated

Use TDD for each behavioral contract.

Required automated coverage:
- map/compiler accepts valid relief/material metadata,
- compiler rejects malformed relief data,
- new visual data stays inside world bounds,
- bridge deck remains ground while underpass remains naval water,
- harbour roads/routes remain valid,
- no reference-picture runtime asset exists,
- no major landmark asset is missing,
- QA checkpoint API still resolves all hero districts,
- camera extremes do not expose the outside of the map,
- visual-cache keys change when art/map revision changes.

### Visual

Automated tests cannot establish 8/10.

For each hero zone:
1. capture quiet center frame,
2. capture left/right pan frames where applicable,
3. compare against the exact corresponding blueprint crop,
4. score the district,
5. fix the largest composition/material/depth mismatch,
6. recapture.

A district does not pass by averaging a strong landmark over weak terrain.

### Performance

After each hero district:
- inspect 1080 × 1920 output,
- confirm no obvious cache seams during pan,
- keep dynamic water and atmosphere active,
- preserve readable hostile projectiles,
- measure representative frame timing when runtime tooling is available.

## Release acceptance

A final release may be described as “8/10+ against the blueprint” only if:

- weighted score >= 8.0/10,
- Bridge Gateway >= 8.0,
- Harbour >= 8.0,
- Canyon/Dam >= 8.0,
- Citadel >= 8.0,
- all automated tests pass,
- release build succeeds,
- reference/background image absence check passes,
- final captures come from the packaged runtime,
- unresolved visual defects are documented.

If the build exceeds the blueprint in micro-detail but changes landmark composition or geography, it does not pass.

## Out of scope for this recovery

- new aircraft,
- new missions,
- new progression systems,
- engine/framework migration,
- redesign of controls/HUD,
- new campaign mechanics,
- using AI-generated full-scene backgrounds as runtime maps.

The recovery is intentionally constrained to Level 1 environment quality and the renderer/data improvements required to support it.
