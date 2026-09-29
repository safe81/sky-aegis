# Environment Sprite Prompts and Provenance

Generated on 2026-09-10 with the built-in `image_gen` tool in three distinct concurrent calls. The PNG outputs were copied byte-for-byte from the generated originals; no image editing or post-processing was applied.

## Shared specification

Use case: stylized-concept

Asset type: production game environment sprite, clean modular cutout

Style/medium: polished commercial 2.5D military vertical shooter; rich photorealistic painted materials readable at actual small gameplay scale; orthographic camera almost directly overhead with a slight south-facing elevation that reveals raised walls; no vanishing point.

Lighting/mood: coherent soft upper-left sunlight, crisp material definition, only small internal contact shadows.

Color palette: natural olive vegetation, warm pale limestone, tan concrete, restrained teal machinery.

CRITICAL OUTPUT: one isolated object on a genuinely transparent background with clean alpha edges. Absolutely no ocean, water, terrain, ground plane, halo, frame, rectangular base, UI, labels, text, logos, people, planes, bullets, particles, weapons, or large baked cast shadow extending outside the object's silhouette.

## Cliff coast module

Canvas/composition: portrait 1024x1536, long north-south composition, asset centered and fully visible with generous transparent margin.

Primary request: CLIFF COAST module — a large asymmetrical hooked limestone headland whose irregular silhouette has several bays and projecting points. Make the craggy, visibly tall layered rock edges readable. Across the plateau place small olive and pine groves, sparse grasses, and one worn sinuous military road with guardrails. Include one small service building and several empty turret sockets formed as small concrete circles near the shoreline. No rectangular base.

Original: `/workspace/scratch/8f5d7822ed67/generated_images/exec-fb50a46d-d7b3-4a9f-981c-1b5a1b8ff77b.png`

## Harbour module
Canvas/composition: square 1024x1024, centered and fully visible with transparent open-water cutouts and transparent outer margins.

Primary request: HARBOUR module — an asymmetrical L/U-shaped battered concrete industrial naval apron with two long projecting finger piers. Preserve large open water cutouts as actual transparency. Build a beveled raised seawall with rusted braces, inset drains, diagonal striped edges, detailed tire marks, and irregular chamfered corners. At the shore end only, add a few stacked shipping containers, restrained teal pipework and tanks, and compact service buildings. Include several clear open circular pads intended for interactive guns or fuel, but place no weapons on them.

Original: `/workspace/scratch/8f5d7822ed67/generated_images/exec-c078922f-6d10-49cb-abc7-3c2df4d4381d.png`

## Bridge module

Canvas/composition: landscape 1536x1024, long horizontal span centered and fully isolated, road crosses left-to-right with a subtle southwest-to-northeast diagonal, generous transparent margin.

Primary request: BRIDGE module — a long modern military steel truss road bridge, orthographic overhead with a slight view of the south edge. Include thick concrete abutments, clearly visible elevated edges, detailed segmented weathered asphalt deck, road rails, and lattice steel edge beams in restrained teal-grey. Structural towers may cast only small shadows contained within the asset. Keep the entire bridge and both abutments fully inside frame.

Original: `/workspace/scratch/8f5d7822ed67/generated_images/exec-8517bebd-1866-4ff8-8111-3c58af8f087b.png`

## Output verification

All three outputs are RGBA PNG files and contain transparent pixels. The harbour generator returned 1254x1254 despite the requested 1024x1024 canvas; it is preserved unchanged per the no-edit requirement.
