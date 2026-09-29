# Sky Aegis — Coastal Intercept Visual Benchmark v2

Sky Aegis is a portrait mobile vertical-shooter project. This repository contains the production visual proof used to establish the art, lighting, effects and encounter pipeline before scaling the full game.

## Visual target

Sky Force Reloaded is used as a **quality benchmark only**. No Sky Force art, audio, source code, logos or other assets are included. The target is the same class of visual relationships: a battlefield that looks authored even with effects disabled, coherent materials and shadows, vivid but readable combat effects, persistent aftermath and large component-based encounters.

## What v2 contains

- 720 × 1,280 fixed portrait gameplay field.
- One authored 720 × 9,216 coastal/harbour battlefield generated from reproducible source.
- Original Falcon, enemy fighter, bomber, gunboat, turret and Leviathan artwork.
- Altitude/contact shadows and consistent upper-left world lighting.
- Cyan/white friendly fire and high-contrast magenta hostile projectile cores.
- Layered metallic/ground/water destruction: event light, fireballs, sparks, fragments, smoke, water reaction and persistent scorch/wreck states.
- Rescue interaction, salvage collection, EMP presentation and a multi-part boss with individual modules and a telegraphed beam.
- Deterministic `snapshot=<seconds>` review mode for fixed visual comparisons.
- Portrait layout verified at 360×640, 390×844 and 430×932 with no console errors in the capture pass.

## Run locally

Serve the repository through a static HTTP server and open `index.html`. Primary fire is automatic. Drag/touch to move, press the EMP button for the signature effect, and use the pause control to suspend the scene.

## Rebuild the original runtime art

```text
python -m pip install pillow numpy
python tools/gen_assets.py
python tools/gen_map.py
```

The GitHub Pages workflow performs the same art generation during deployment, so binary runtime art does not need to be stored in the repository.

## Production sequence

The benchmark deliberately prioritizes the battlefield before roster expansion. Once R1 (quiet world), R3 (busy destruction) and R6 (boss spectacle) pass the intended quality gate on real phones, the same master-art and VFX rules should be applied to the remaining aircraft and later missions rather than introducing another placeholder pipeline.
