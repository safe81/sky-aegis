import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';
import {AIRCRAFT} from '../dist/src/game/content/aircraft.js';import {ENEMIES} from '../dist/src/game/content/enemies.js';
import {allProductionArtUrls} from '../dist/src/game/render/ProductionArt.js';
test('all nine craft, ten enemy families and their referenced sprite files are packaged',async()=>{
 assert.equal(AIRCRAFT.length,9);assert.equal(ENEMIES.length,10);assert.equal(new Set(AIRCRAFT.map(c=>c.id)).size,9);
 for(const family of ['laser','minigun','missile'])assert.equal(AIRCRAFT.filter(c=>c.weapon.family===family).length,3);
 for(const p of new Set(allProductionArtUrls()))await access(new URL('../dist/'+p,import.meta.url));
});
