# Sky Aegis — Coastal Intercept Visual Benchmark

This repository contains the first production visual proof for **Sky Aegis**, a portrait mobile vertical shooter. The scene is deliberately focused on the visual pipeline rather than campaign breadth: one authored 9,216 px battlefield, production-style aircraft/enemy sprites, altitude/contact shadows, persistent aftermath, layered VFX, readable hostile projectiles, a rescue interaction, salvage, and a multi-part boss.

## Visual target

Sky Force Reloaded is used as a **quality benchmark only**. No Sky Force art, audio, code, logos or other assets are included. The target is the same class of visual relationships: authored scenery that remains finished without particles, material separation, strong depth cues, bright but readable combat effects, persistent wreckage/scorching, and large component-based encounters.

## Run locally

Serve the repository through any static HTTP server and open `index.html`. Primary fire is automatic. Drag/touch to move, press the EMP button for the signature effect, and use the pause button to suspend the scene.

## Rebuild art assets

The checked-in source is intentionally reproducible. Run:

```text
python -m pip install pillow numpy
python tools/gen_assets.py
python tools/gen_map.py
```

This generates the runtime images under `assets/`. The GitHub Pages workflow performs the same generation automatically before deployment.

## Visual proof sequence

The deterministic scene runs from open water into coast/harbour infrastructure, two raised bridges, a narrowing industrial channel and a fortress/boss arena. The boss enters at roughly 43 seconds. Query parameter `snapshot=<seconds>` advances the fixed 60 Hz simulation to a deterministic review frame.

## Quality rules already enforced in the proof

- 720 × 1280 logical gameplay field and fixed portrait composition.
- Separate aircraft art and collision logic.
- Friendly cyan/white fire, hostile magenta threat cores and gold salvage.
- Authored world lighting, altitude shadows, cast/contact shadows and local event lights.
- Metal, water and ground destruction paths with fireball, sparks, fragments, smoke and aftermath.
- Low-priority decoration never replaces lethal projectile rendering.
- Persistent wrecks and scorch marks.
- Multi-part boss with individual modules, damaged-state smoke, readable HP and a telegraphed luminous beam.
- 360×640, 390×844 and 430×932 portrait layout smoke tests.

## Scope

This is the visual benchmark slice, not the complete nine-aircraft campaign. The next content milestone should reuse this pipeline rather than multiplying placeholder art.
