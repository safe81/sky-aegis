import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {roadNetworkPath} from '../dist/src/game/content/coastalGeography.js';
import {Environment} from '../dist/src/game/render/Environment.js';

const mission=await readFile(new URL('../dist/src/game/content/mission1.js',import.meta.url),'utf8');
const director=await readFile(new URL('../dist/src/game/missions/MissionDirector.js',import.meta.url),'utf8');

test('road network can traverse a bridge and branch road by node ids',()=>{
 const path=roadNetworkPath('bridge-west','civil-east-loop-end');
 assert.ok(path.length>=2);
 assert.ok(path.some(x=>x.kind==='bridge'&&x.bridgeId==='narrows-bridge'));
 assert.ok(path.some(x=>x.kind==='road'&&x.roadId==='east-port-road'));
});

test('environment resolves stable anchors directly instead of nearest substitution',()=>{
 const env=Environment.build();
 const a=env.socketAtAnchor('rescue-alpha',427.5,'rescue_zone');
 assert.equal(a.id,'rescue-alpha');
 assert.equal(a.anchorId,'rescue-alpha');
 assert.equal(a.district,'dense-archipelago');
 assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));
 const source=env.sockets.find(x=>x.anchorId==='rescue-alpha'||x.id==='rescue-alpha');
 assert.equal(a.x,source.x);
 assert.equal(a.y,source.y+427.5);
 assert.throws(()=>env.socketAtAnchor('rescue-alpha',427.5,'aa_pad'),/expected role/);
});

test('surface mission content declares explicit authored anchors',()=>{
 for(const id of ['fuel-cliff','aa-cliff-main','aa-cliff-offshore','rescue-alpha','water-outer-1','fuel-narrows','missile-narrows','rescue-bravo','fuel-military','rescue-charlie'])assert.match(mission,new RegExp(`anchorId:\\s*['\"]${id}['\"]`));
 assert.match(director,/socketAtAnchor/);
});
