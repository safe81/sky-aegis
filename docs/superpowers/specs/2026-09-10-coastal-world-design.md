# Coastal world rebuild

The user-approved audit directs this architectural replacement. Preserve the nine aircraft, ten enemy families, existing save/progression, input and bosses. Work against the provided executable ES modules; original TypeScript was not included.

## Composition and rendering
Authored non-repeating placements of detailed transparent coast, harbour and bridge modules. Each module has a footprint, upper-left structural shadow cast down-right, edge/water contact layer, elevation and named interactive sockets. Draw order: moving water; contact/structural shadows; module material; decals/wrecks; surface targets; elevated foreground structure; altitude shadows/aircraft; friendly fire; illumination/fire/smoke; hostile rounds; HUD. No full-screen background painting.

## Gameplay
Flight entrances and repositioning are cubic paths. Attack state is entrance, position, telegraph, timed burst, recovery, reposition, second attack, exit. Each family has a recognizable cadence/pattern. Ground actors and props follow the same scroll offset as their environment. Carrier weapons remain independently destroyable.

## Framing
Keep 720 by 1280 logical combat bounds and 1152-wide world. Extend scenery above and below the logical combat area on tall phones, without stretching sprites or changing collision. Place readable HUD at display edges.

## Evidence
Deterministic actual-game screenshots at 4 seconds and 11 seconds, quiet terrain, damage, miniboss and carrier. Inspect the extracted final package with browser QA, validate asset loading and motion. Node tests cover choreography timing, scroll anchoring, frame independence, effects stages and existing outcome semantics. Never claim commercial polish or production readiness solely from tests. No real physical-phone performance claim.
