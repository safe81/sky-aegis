import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');
const water=await readFile(new URL('../dist/src/game/render/WaterSurface.js',import.meta.url),'utf8');
const atmosphere=await readFile(new URL('../dist/src/game/render/Atmosphere.js',import.meta.url),'utf8');

test('water remains a time-driven animated surface rather than a static background',()=>{
 assert.match(water,/uniform float time/);
 assert.match(water,/scroll/);
 assert.match(water,/ripples|swell/);
});

test('level 1 renders authored moving cloud layers and their shadows',()=>{
 assert.match(coastal,/drawCloudShadows/);
 assert.match(coastal,/drawCloudLayer/);
 assert.match(coastal,/atmosphere/i);
 assert.match(coastal,/time/);
});

test('terrain renderer respects per-polygon biome materials',()=>{
 assert.match(coastal,/land\.material/);
 assert.match(coastal,/land-tropical/);
 assert.match(coastal,/land-alpine/);
 assert.match(coastal,/land-snow/);
});

test('shorelines render authored cliff relief and the dam emits animated spillway spray',()=>{
 assert.match(coastal,/drawProjectedCliffFaces\(/);
 assert.match(coastal,/rock-cluster/);
 assert.match(coastal,/drawDamSpray\(/);
 assert.match(coastal,/Math\.sin\(time/);
});


test('atmosphere uses restrained depth bands and wisps instead of giant repeated cloud blobs',()=>{
 assert.match(atmosphere,/drawDepthMistBand/);
 assert.match(atmosphere,/drawWisp/);
 assert.match(atmosphere,/maxWispWidth/);
 assert.doesNotMatch(atmosphere,/function blob\(/,'legacy giant blob renderer should be removed');
});
