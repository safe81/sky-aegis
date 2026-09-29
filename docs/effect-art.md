# Effect artwork

Two original RGBA assets generated with the built-in image generation tool on 2026-09-11, copied unchanged into the game. Runtime cropping selects the four fireball stages; smoke is a separate drifting layer. The supplied explosion/smoke textures contained blue artefacts and are retained only as unused source assets.

## Fireball sequence

File: `dist/art/effects/fireball-sequence-v2.png`.

Prompt:

Use case: stylized-concept. Asset type: original animated fireball sprite atlas for the Sky Aegis 2.5D overhead military shooter. Create one square RGBA PNG with TRUE TRANSPARENT BACKGROUND. Exact 2 by 2 grid, four equally sized square cells, no grid lines. Each cell contains a centered isolated explosion at a successive time: top left compact white-yellow ignition with orange lobes; top right expanding rich orange fireball with white-hot core; bottom left wide boiling orange flames with dark red edges; bottom right dying deep orange incandescent cloud with charcoal edges. Every sprite entirely contained in its own cell with 15 percent transparent margins; centers exactly at 25/25,75/25,25/75,75/75 percent of canvas. No pieces outside the cells. Render realistic volumetric turbulent flame billows seen from directly overhead; dense material detail that reads at 100px; not a flat circle. Hot white-gold and orange-red fire ONLY; no blue, no cyan, no purple, no grey/white backdrop, no text, no borders, no background gradient, no sparks, no debris, no smoke plume, no aircraft, no scenery. Four genuine animation stages of the same expanding fireball, not four different designs. Runtime supplies separate smoke, sparks and illumination. Keep transparency around all flames.

## Smoke volume

File: `dist/art/effects/smoke-volume-v2.png`.

Prompt:

Use case: stylized-concept. Asset type: one volumetric smoke particle sprite for a polished 2.5D overhead military shooter. Create a square RGBA PNG with a GENUINELY TRANSPARENT background and a single centered irregular rounded plume of dense charcoal smoke, seen from near overhead. Large beautiful rolling turbulent billows, several overlapping lobes, subtle upper-left warm sunlight making gray highlights, rich dark inner cavities, very soft feathered alpha around all edges. No hard silhouette outline. Plume occupies central 75 percent of image, fully surrounded by transparent margin. Neutral warm gray to charcoal palette only. Nothing else: no fire, no sparks, no debris, no ground, no shadow outside plume, no ocean, no blue, no cyan, no white background, no checkerboard pattern, no text or border. All pixels outside the plume must have actual alpha zero. This sprite will be layered, drifted and faded independently over explosions at runtime.
