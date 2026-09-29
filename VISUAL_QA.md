# Sky Aegis Visual QA — Coastal Intercept v2

## Goal

The visual benchmark is the supplied Sky Force Reloaded reference set: authored terrain, readable materials, cast/altitude shadows, bright but legible projectile cores, persistent destruction aftermath and multi-part boss spectacle. The successor uses original art and code.

## v2 visual changes

- Re-authored the complete 720 × 9,216 battlefield with open water, coastal roads, raised bridges, dockyards, warehouses, cranes, tanks, container yards, industrial canal sections and a dedicated fortress/boss basin.
- Rebuilt Falcon, fighter, bomber, gunboat, turret, boss module and Leviathan hull artwork using supersampled source rendering, bevel/highlight separation, panel lines, emissive details and consistent upper-left lighting.
- Increased aircraft scale and weapon luminosity at real phone size without enlarging collision logic.
- Strengthened event lighting, fireball volume and smoke/debris density while preserving the hostile projectile pass above decorative effects.
- Reduced the final vignette so authored environment detail survives at the screen edges.
- Removed development-quality text from the gameplay field.

## Browser smoke tests

The deterministic capture harness was executed with Chromium using the final source and generated assets. No console errors were reported in these captures:

- 360 × 640 — combat snapshot 9.5 s
- 390 × 844 — combat snapshot 9.5 s
- 430 × 932 — quiet opening 0.2 s
- 430 × 932 — combat/effects 9.5 s
- 430 × 932 — Leviathan encounter 48 s

JavaScript syntax and both Python asset generators also pass local parse/compile checks. All generated runtime asset dimensions were validated.

## Acceptance discipline

This is a visual-production slice, not a claim that the full game is commercially finished. The next visual gate should compare the fixed R1/R3/R6 captures against the reference at actual phone size and only then extend this exact art/effects pipeline to the remaining aircraft and campaign missions.
