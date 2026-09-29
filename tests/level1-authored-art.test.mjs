import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {COASTAL_GEOGRAPHY} from '../dist/src/game/content/coastalGeography.js';

let art=null;try{art=await import('../dist/src/game/content/level1Art.js');}catch{}
const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');

test('level 1 compiles explicit authored art instances for major architecture',()=>{
 assert.ok(Array.isArray(COASTAL_GEOGRAPHY.artInstances)&&COASTAL_GEOGRAPHY.artInstances.length>=24,'major architecture must be explicit art instances');
 const ids=new Set(COASTAL_GEOGRAPHY.artInstances.map(i=>i.id));
 for(const id of ['dam-face-main','citadel-gate-main','citadel-wing-west','citadel-wing-east','naval-crane-west','naval-crane-east'])assert.ok(ids.has(id),`missing ${id}`);
 assert.ok(COASTAL_GEOGRAPHY.artInstances.every(i=>i.assetId&&i.renderLayer&&i.visualBounds&&i.groundFootprint));
});

test('all authored art instance assets exist in the level 1 registry and package',async()=>{
 assert.ok(art?.LEVEL1_ART,'level1Art registry must exist');
 for(const instance of COASTAL_GEOGRAPHY.artInstances){
  const def=art.LEVEL1_ART[instance.assetId];assert.ok(def,`unregistered ${instance.assetId}`);
  assert.ok(def.url&&Number.isFinite(def.pivotX)&&Number.isFinite(def.pivotY)&&def.pixelsPerWorldUnit>0);
  await access(new URL(`../dist/${def.url}`,import.meta.url));
 }
});

test('dam face registry anchors the modular face at its downstream toe',()=>{
 assert.ok(art?.LEVEL1_ART?.['dam-face']);
 const def=art.LEVEL1_ART['dam-face'];
 assert.equal(def.pivotY,def.sourcePixelHeight,'dam artwork should grow upward from its authored toe so map visual bounds match rendering');
});

test('constructed scene uses authored structure, shore and atmosphere modules',async()=>{
 for(const path of ['../dist/src/game/render/AuthoredStructures.js','../dist/src/game/render/ShoreEffects.js','../dist/src/game/render/Atmosphere.js'])await access(new URL(path,import.meta.url));
 assert.match(coastal,/AuthoredStructures|drawAuthoredStructures/);
 assert.match(coastal,/ShoreEffects|drawShoreEffects/);
 assert.match(coastal,/Atmosphere|drawAtmosphere/);
});
