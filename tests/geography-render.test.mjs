import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');

test('coastal renderer consumes continuous master geography rather than SCENES modules',()=>{
 assert.match(source,/visibleLand\(/);
 assert.match(source,/visibleRoads\(/);
 assert.match(source,/visibleDocks\(/);
 assert.match(source,/visibleShorelines\(/);
 assert.doesNotMatch(source,/m\.kind==='harbour'.*\.21/s);
});

test('terrain uses authored polygon clips and textured road polylines',()=>{
 assert.match(source,/createPattern/);
 assert.match(source,/drawPolygon/);
 assert.match(source,/drawRoad/);
 assert.match(source,/setLineDash/);
 assert.match(source,/shoreline/i);
});

test('chunks remain a cache only and cannot invent terrain',()=>{
 assert.match(source,/this\.environment\.map/);
 assert.doesNotMatch(source,/SCENES/);
 assert.doesNotMatch(source,/encounter/i);
});

test('renderer supports carved harbour water and authored breakwaters',()=>{
 assert.match(source,/visibleWaterCutouts\(/);
 assert.match(source,/visibleMaritimeStructures\(/);
 assert.match(source,/destination-out/);
 assert.match(source,/maritime/i);
});
