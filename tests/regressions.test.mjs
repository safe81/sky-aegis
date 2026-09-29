import test from 'node:test';import assert from 'node:assert/strict';
import {World} from '../dist/src/game/simulation/World.js';
import {BossController} from '../dist/src/game/bosses/BossController.js';
import {MissionDirector} from '../dist/src/game/missions/MissionDirector.js';
import {EnemySystem} from '../dist/src/game/enemies/EnemySystem.js';
import {WeaponSystem} from '../dist/src/game/weapons/WeaponSystem.js';
import {GameSession} from '../dist/src/game/GameSession.js';
import {flightPose} from '../dist/src/game/enemies/EncounterPaths.js';
const player=w=>w.spawnEntity({id:'player',kind:'player',faction:'player',x:576,y:1060,hp:100,radius:10,data:{}});
test('collision kill on the event-pruning tick awards score exactly once',()=>{
 const world=new World(),p=player(world),mission=new MissionDirector();mission.start(world,p);mission.nextEvent=1e6;
 const victim=world.spawnEntity({kind:'enemy',faction:'enemy',x:576,y:500,hp:1,radius:12,medalEligible:true});mission.registerEligibleEntity(victim);
 world.spawnProjectile({faction:'player',x:576,y:500,vx:0,vy:0,damage:2,radius:2,ttl:1});world.tick=299;
 const s=Object.assign(Object.create(GameSession.prototype),{world,mission,stage:{getBoundingClientRect:()=>({width:720})},input:{consumeMovement:()=>({dx:0,dy:0}),consumeAction:()=>false},craft:{speed:400},profile:{settings:{sensitivity:1}},enemies:{update(){}},weapons:{updatePlayer(){},updateGuidance(){}},effects:{consumeEvents(){},update(){},seen:new Set()},seenAudio:new Set(),consumeAudioEvents(){}});
 s.step(1/60);s.step(1/60);s.step(1/60);assert.equal(victim.destroyed,true);assert.equal(mission.objectives.eligibleDestroyed,1);assert.equal(world.score,100);
});
test('a new carrier weapon phase gives its own full warning interval',()=>{
 const w=new World(),p=player(w),b=new BossController();b.spawnLeviathan(w);
 for(let i=0;i<420;i++)b.updateAttacks(w,p,1/60);
 for(const id of ['lev-cannon-l','lev-cannon-r'])w.damageEntity(id,10000);b.updateState(w);
 const before=w.projectiles.size;for(let i=0;i<55;i++)b.updateAttacks(w,p,1/60);
 assert.equal(b.phase,'missiles');assert.equal(w.projectiles.size,before,'missiles may not catch up to the previous phase clock');assert.ok(w.getEntity('lev-missile-l').data.telegraphPulse>0);
 for(let i=0;i<20;i++)b.updateAttacks(w,p,1/60);assert.ok(w.projectiles.size>before);
});
test('convoy vehicles occupy distinct positions on the same road',()=>{
 const w=new World(),p=player(w),m=new MissionDirector(),e=new EnemySystem(new WeaponSystem());m.scrollDistance=95*35;w.scrollDistance=95*35;
 const a=m.spawnAnchoredEnemy(w,e,{family:'armoured-vehicle',x:166,y:80}),b=m.spawnAnchoredEnemy(w,e,{family:'armoured-vehicle',x:205,y:-30});
 for(let i=0;i<300;i++){e.update(w,p,1/60,0);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>38,'vehicles must retain convoy spacing');}
});
test('sweeper remains continuous across telegraph, attack and reposition',()=>{
 let prev=flightPose('side-sweeper',{x:175,y:-55},0);for(let i=1;i<17000;i++){const p=flightPose('side-sweeper',{x:175,y:-55},i*.001);assert.ok(Math.hypot(p.x-prev.x,p.y-prev.y)<3,`position jumps at ${i*.001}s`);prev=p;}
});
