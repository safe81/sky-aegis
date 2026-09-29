# Level 1 geography pipeline — v1.4.0

## Production source of truth

`dist/maps/coastal-intercept.tmj` is the only authored production map.

Normal pipeline:

`Tiled TMJ -> scripts/compile-geography.mjs -> geography validator -> coastalGeographyData.js -> Environment -> CoastalScene`

The reverse exporter is migration-only and cannot overwrite the production TMJ.

## Tiled layers

- `Districts` — fifteen contiguous journey regions with biome/elevation metadata.
- `Land` — tropical, alpine and snow natural/reclaimed land polygons.
- `Water Cutouts` — harbour basins/dry docks that reveal the animated water surface.
- `Concrete` — port aprons and fortress platforms.
- `Maritime Structures` — breakwaters, seawalls and dam.
- `Docks` — piers/quays.
- `Roads` — graph-connected road polylines.
- `Road Nodes` — named graph junctions.
- `Shorelines` — coast/island contact lines used for foam and cliff relief.
- `Bridges` — elevated road links.
- `Landmarks` — navigation/composition anchors.
- `Decorations` — modular buildings, tanks, containers, rocks, palms, lamps, helipads.
- `Sockets` — stable gameplay anchors with role and district.
- `Reference Trace` — approved-reference west bank, east bank and water spine.
- `Atmosphere Zones` — cloud density/speed, fog and atmosphere type.

## Authoring rules

1. Geography exists before encounters; encounters never create terrain.
2. A road must be supported by land/concrete/dock or an explicit bridge.
3. Water lanes must remain on water; fixed weapons/rescues must be on valid authored surfaces.
4. District boundaries must be contiguous.
5. Main banks must retain enough authored detail to avoid long straight corridor walls.
6. The approved reference controls the macro journey; the runtime remains layered/animated rather than a stretched static image.

## Build

After map edits:

```text
node scripts/compile-geography.mjs
npm test
```

The release command `node scripts/build-release.mjs` recompiles the TMJ before generating the offline cache/asset manifest.
