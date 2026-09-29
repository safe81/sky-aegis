import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Environment} from '../dist/src/game/render/Environment.js';

const missionSource=await readFile(new URL('../dist/src/game/missions/MissionDirector.js',import.meta.url),'utf8');

test('mission placement asks geography for role-specific sockets',()=>{
 assert.match(missionSource,/aa_pad/);
 assert.match(missionSource,/missile_pad/);
 assert.match(missionSource,/water_lane/);
 assert.match(missionSource,/rescue_zone/);
 assert.match(missionSource,/routeForRoadVehicle/);
 assert.doesNotMatch(missionSource,/visibleModules\(this\.scrollDistance\).*coast/s);
});

test('role-specific socket lookup never substitutes a different surface family',()=>{
 const env=Environment.build();
 const used=new Set();
 const aa=env.nearestSocket(500,300,6000,used,'aa_pad');assert.ok(aa);assert.equal(aa.role,'aa_pad');used.add(aa.id);
 const water=env.nearestSocket(700,300,6000,used,'water_lane');assert.ok(water);assert.equal(water.surface,'water');
 const rescue=env.socketAtAnchor('rescue-bravo',9856,'rescue_zone');assert.ok(rescue);assert.equal(rescue.role,'rescue_zone');
});
