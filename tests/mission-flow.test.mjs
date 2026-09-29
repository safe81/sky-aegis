import test from 'node:test';import assert from 'node:assert/strict';
import {World} from '../dist/src/game/simulation/World.js';
import {WeaponSystem} from '../dist/src/game/weapons/WeaponSystem.js';
import {EnemySystem} from '../dist/src/game/enemies/EnemySystem.js';
import {MissionDirector} from '../dist/src/game/missions/MissionDirector.js';
import {BossController} from '../dist/src/game/bosses/BossController.js';
import {computeMedals} from '../dist/src/game/missions/MissionDirector.js';
test('scripted mission settles once after both bosses and all six rescues',()=>{
 // Injected damage and player positioning test mission orchestration, not balance.
 const w=new World(),weapons=new WeaponSystem(),enemies=new EnemySystem(weapons),m=new MissionDirector(),b=new BossController();
 const p=w.spawnEntity({id:'player',kind:'player',faction:'player',x:576,y:1070,hp:100,radius:10,data:{invulnerable:999}});m.start(w,p);
 const phases=new Set();let settlements=0;
 for(let tick=0;tick<60*300&&!m.result;tick++){
  for(const e of w.entities.values())if(e.active&&e.faction==='enemy')w.damageEntity(e.id,100000,'test-damage');
  const rescue=[...w.entities.values()].find(e=>e.kind==='rescue'&&e.active);if(rescue){p.x=rescue.x;p.y=rescue.y+140/60;}
  m.update(w,p,enemies,b,1/60);enemies.update(w,p,1/60,m.lastScrollDelta);w.step(1/60);phases.add(b.phase);
  settlements+=w.events.filter(e=>e.type==='missionSettled').length;w.clearTransientEvents(w.tick);
 }
 assert.equal(m.result?.completed,true);assert.equal(m.result.rescued,6);assert.equal(m.result.eligibleDestroyed,m.result.eligibleTotal);assert.ok(m.result.eligibleTotal>=40);
 for(const phase of ['breakwater','cannons','missiles','reactor','defeated'])assert.ok(phases.has(phase),phase);
 const result=m.result;m.finish(w,true);assert.equal(m.result,result);assert.equal(w.events.filter(e=>e.type==='missionSettled').length,0);assert.equal(settlements,1);
 assert.equal(computeMedals(m.objectives).count,4);
});
