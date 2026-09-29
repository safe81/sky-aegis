import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSION1_EVENTS} from '../dist/src/game/content/mission1.js';
import {COASTAL_GEOGRAPHY} from '../dist/src/game/content/coastalGeography.js';

const anchoredFamilies=new Set(['aa-turret','missile-battery','gunboat']);

test('all authored surface events use stable anchors or an explicit road route',()=>{
 for(const event of MISSION1_EVENTS){
  if(event.kind==='prop'||event.kind==='rescue')assert.ok(event.anchorId,`${event.kind} at ${event.at}s missing anchorId`);
  if(event.kind==='mixed')for(const entry of event.entries){
   if(anchoredFamilies.has(entry.family))assert.ok(entry.anchorId,`${entry.family} at ${event.at}s missing anchorId`);
   if(entry.family==='armoured-vehicle')assert.ok(entry.roadId,`armoured vehicle at ${event.at}s missing roadId`);
  }
  if(event.kind==='miniboss'||event.kind==='boss')assert.ok(event.anchorId,`${event.kind} missing authored arena anchor`);
 }
});

test('every mission anchor resolves to the expected role and district',()=>{
 const sockets=new Map(COASTAL_GEOGRAPHY.sockets.map(s=>[s.anchorId,s]));
 const expectedRole=(event,entry)=> event.kind==='rescue'?'rescue_zone':event.kind==='prop'?'prop_pad':event.kind==='miniboss'?'boss_zone':event.kind==='boss'?'boss_zone':entry.family==='aa-turret'?'aa_pad':entry.family==='missile-battery'?'missile_pad':entry.family==='gunboat'?'water_lane':null;
 for(const event of MISSION1_EVENTS){
  const entries=event.kind==='mixed'?event.entries:[event];
  for(const entry of entries){
   const anchorId=entry.anchorId; if(!anchorId)continue;
   const socket=sockets.get(anchorId);assert.ok(socket,`missing socket ${anchorId}`);
   const role=expectedRole(event,entry);if(role)assert.equal(socket.role,role,`${anchorId} role`);
   assert.ok(socket.district,`${anchorId} district`);
  }
 }
});

test('free-flight encounter coordinates span the authored wide world',()=>{
 const maxX=Math.max(...MISSION1_EVENTS.flatMap(event=>[
  ...(event.xs??[]),
  ...(event.entries??[]).filter(e=>!e.anchorId&&e.family!=='armoured-vehicle').map(e=>e.x),
 ].filter(Number.isFinite)));
 assert.ok(maxX>COASTAL_GEOGRAPHY.bounds.maxX*.8,`free-flight waves only reach x=${maxX} of ${COASTAL_GEOGRAPHY.bounds.maxX}`);
});
