# Level 1 Visual Contract — 2026-09-14

## Authority

`reference/LEVEL1_BLUEPRINT.png` (682 × 2048) remains the visual authority and is review-only. It must never be loaded by `dist/`, a service worker, an atlas, a district screenshot, or a renamed/re-encoded runtime asset.

## Frozen registration

The reconstruction uses one uniform projection registration: `scale = 3.82080078125`, `originX = 0`, `originY = -6525`, producing world bounds `0…2605.7861328125 × -6525…1300`. X and Y use the same scale. The portrait camera remains 720 × 1280 logical units and pans horizontally across the wider authored world.

The current implementation does **not** use the optional 4096 × 20480 extended production model. The original blueprint proportions are preserved directly. If mission pacing later needs extra distance, extension must be authored as explicit connector reaches and reviewed under the correspondence rules in the handoff plan rather than stretching the reference.

## Projection, lighting and depth

The scene is a projected 2.5D reconstruction. Visible water-contact lines, cliff faces, upper ledges, roads, bridge decks/supports, quays and architecture are distinct layers. Static world lighting uses a consistent upper-left key with restrained ambient fill; local weapon/explosion lighting remains dynamic. Large cast shadows are separate from modular artwork where they cross live water or other surfaces.

## Materials

The core families are deep/shallow/river water, tropical land, temperate rock/vegetation, concrete/dock metal, alpine rock, snow/ice, painted military steel, and warm civil-harbour roofs. Threat readability takes priority over terrain contrast. Shore contact uses authored `beach`, `rock`, `quay` and `ice` types rather than a single dashed line effect.

## Recognition cues

The fifteen review checkpoints are `dist/qa/level1-checkpoints.json`. The critical sequence is open sea → two archipelago zones → narrows → bridge gateway → civil harbour → industrial harbour → naval yard → mountain transition → canyon → dam → alpine reservoir → frozen valley → fortress approach → citadel basin. Each checkpoint identifies exact required feature IDs from `level1-trace-inventory.json`.

## Acceptance state

The runtime architecture, registration, semantic surfaces, modular structure pipeline, live water/shore/atmosphere passes and deterministic checkpoint API are implementation contracts. Automated checks can verify these contracts. Full visual equivalence remains a human/runtime capture gate: quiet, combat, pan-extreme, transition and motion evidence must be reviewed before the level can be labelled visually accepted. Physical iPhone/Android performance remains `NOT VERIFIED` until measured on those devices.
