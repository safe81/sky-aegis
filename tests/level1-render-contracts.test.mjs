import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');
const water=await readFile(new URL('../dist/src/game/render/WaterSurface.js',import.meta.url),'utf8');
const shore=await readFile(new URL('../dist/src/game/render/ShoreEffects.js',import.meta.url),'utf8');
const atmosphere=await readFile(new URL('../dist/src/game/render/Atmosphere.js',import.meta.url),'utf8');

test('water rendering consumes authored water regions and their depth/current/ice metadata',()=>{
 assert.match(coastal,/waterRegions/);
 assert.match(water,/depthClass/);
 assert.match(water,/flowX/);
 assert.match(water,/iceCoverage/);
});

test('cliff styling derives from authored district biome rather than obsolete world-Y magic numbers',()=>{
 assert.match(coastal,/districtAtWorldY/);
 assert.doesNotMatch(coastal,/-15400|-23400/);
});

test('shore and atmosphere live effects use dedicated authored modules',()=>{
 assert.match(coastal,/drawShoreEffects/);
 assert.match(coastal,/drawAtmosphere/);
 assert.doesNotMatch(shore,/setLineDash/);
 assert.match(atmosphere,/pass==='shadow'/);
 assert.match(atmosphere,/pass==='low'/);
 assert.match(atmosphere,/pass==='high'/);
});

test('hero terrain uses a dedicated irregular relief renderer instead of synthetic mountain triangles',async()=>{
 const relief=await readFile(new URL('../dist/src/game/render/ReliefRenderer.js',import.meta.url),'utf8');
 assert.match(relief,/export function drawRelief\(/);
 for(const pass of ["'shadow'","'face'","'rim'"])assert.match(relief,new RegExp(`pass===${pass}`));
 assert.match(coastal,/drawRelief\(/);
 assert.doesNotMatch(coastal,/drawMountainCrag\(/,'synthetic triangular mountain primitive must be removed');
});

test('relief pass preserves underlying terrain instead of painting opaque visual-zone slabs',async()=>{
 const relief=await import('../dist/src/game/render/ReliefRenderer.js');
 assert.ok(relief.RELIEF_BASE_ALPHA<=0.35,`relief base alpha is too opaque: ${relief.RELIEF_BASE_ALPHA}`);
});


test('authored material, vegetation and terrain-shadow zones have focused world-anchored render passes',async()=>{
 const detail=await readFile(new URL('../dist/src/game/render/TerrainDetailRenderer.js',import.meta.url),'utf8');
 assert.match(detail,/export function drawMaterialZones\(/);
 assert.match(detail,/export function drawVegetationZones\(/);
 assert.match(detail,/export function drawTerrainShadows\(/);
 assert.match(detail,/zone\.seed/,'detail placement must be deterministic/world anchored');
 assert.doesNotMatch(detail,/Math\.random\(/,'visual detail must not swim between frames');
 assert.match(coastal,/drawMaterialZones\(/);
 assert.match(coastal,/drawVegetationZones\(/);
 assert.match(coastal,/drawTerrainShadows\(/);
});


test('relief renderer builds large fractured rock masses and ledge vegetation cues',async()=>{
 const relief=await readFile(new URL('../dist/src/game/render/ReliefRenderer.js',import.meta.url),'utf8');
 assert.match(relief,/drawRockMasses/);
 assert.match(relief,/drawReliefPine/);
 assert.match(relief,/buildRockPolygon/,'rock masses should be angular multi-vertex formations');
});


test('land textures are subdued beneath large-scale authored material variation',()=>{
 assert.match(coastal,/LAND_PATTERN_ALPHA/);
 assert.match(coastal,/drawLandMacroVariation\(/);
});

test('gateway bridge uses a fortified deck and arched understructure rather than a repeated zigzag truss',()=>{
 assert.match(coastal,/drawFortifiedDeck\(/);
 assert.match(coastal,/quadraticCurveTo\(/);
});


test('shore effects use broad subtle turquoise shelves without neon rock-edge outlines',()=>{
 assert.match(shore,/drawShallowShelf\(/);
 assert.match(shore,/beach\?88:64/,'shallow shelves should be broad enough to read as water depth');
 assert.match(shore,/rgba\(156,220,211,\.22\)/,'rock contact should stay subdued');
 assert.doesNotMatch(shore,/rgba\(244,255,251,\.72\)/,'rock foam must not read as a neon shoreline rail');
});


test('relief renderer adds continuous massif bands and dense ledge forest for hero terrain',async()=>{
 const relief=await readFile(new URL('../dist/src/game/render/ReliefRenderer.js',import.meta.url),'utf8');
 assert.match(relief,/drawMassifBands/);
 assert.match(relief,/drawReliefForest/);
});

test('harbour material zones render connected service infrastructure instead of empty concrete expanses',async()=>{
 const detail=await readFile(new URL('../dist/src/game/render/TerrainDetailRenderer.js',import.meta.url),'utf8');
 assert.match(detail,/function drawHarbourInfrastructure\(/);
 assert.match(detail,/serviceLane/,'harbour infrastructure should define service lanes');
 assert.match(detail,/containerStack/,'harbour infrastructure should define container stacks');
 assert.match(detail,/utilityPad/,'harbour infrastructure should define utility pads');
 assert.match(detail,/drawHarbourInfrastructure\(ctx,zone/,'harbour material zones must invoke infrastructure detail');
});

test('hero relief has a continuous water-facing escarpment with a dark vertical face and lit rim',async()=>{
 const relief=await readFile(new URL('../dist/src/game/render/ReliefRenderer.js',import.meta.url),'utf8');
 assert.match(relief,/function drawWaterFacingEscarpment\(/);
 assert.match(relief,/waterFacingEdge/);
 assert.match(relief,/escarpmentFace/);
 assert.match(relief,/escarpmentRim/);
});

test('harbour concrete uses a subdued texture over a coherent base instead of full-strength noisy tiling',()=>{
 assert.match(coastal,/CONCRETE_PATTERN_ALPHA/);
 assert.match(coastal,/CONCRETE_BASE/);
 assert.match(coastal,/concreteLike/);
});

test('terrain-integrated hero art renders beneath roads instead of covering them',async()=>{
 const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');
 const terrainCall=coastal.indexOf("drawAuthoredStructures(ctx,terrainArt,this.authoredAssets,'terrain',0)");
 const roadCall=coastal.indexOf('for(const road of roads)this.drawRoad(ctx,road)');
 assert.ok(terrainCall>=0,'missing terrain-art pass');
 assert.ok(roadCall>=0,'missing road pass');
 assert.ok(terrainCall<roadCall,'terrain art must render before roads');
});

test('gateway cliff relief is deep enough to read as a vertical landmark wall',()=>{
 assert.match(coastal,/gatewayCliffDepth\s*=\s*Math\.max\(180/,'gateway cliff wall needs >=180 world-unit relief depth');
 assert.match(coastal,/rockColumnCount/,'gateway cliff wall needs explicit rock-column facets');
});

test('authored water currents use organic drift strokes rather than a visible rectangular dash grid',()=>{
 assert.match(water,/currentStrokeCount/,'water current overlay needs organic stroke distribution');
 assert.doesNotMatch(water,/for\(let yy=minY-88\+phase;yy<maxY\+88;yy\+=88\)for\(let xx=minX\+36;xx<maxX;xx\+=132\)/,'water current overlay must not use the old fixed grid');
});
