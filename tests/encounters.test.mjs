import test from 'node:test';import assert from 'node:assert/strict';
import {World} from '../dist/src/game/simulation/World.js';
import {WeaponSystem} from '../dist/src/game/weapons/WeaponSystem.js';
import {EnemySystem} from '../dist/src/game/enemies/EnemySystem.js';
function scene(){const w=new World(42),weapons=new WeaponSystem(),enemies=new EnemySystem(weapons);const p=w.spawnEntity({id:'player',kind:'player',faction:'player',x:576,y:1060,hp:100,radius:10,data:{}});return {w,p,enemies};}
test('fighter telegraphs before firing and emits a spaced burst',()=>{const {w,p,enemies}=scene();const e=enemies.spawn(w,'light-fighter',576,-50);let warned=false,shots=[];
 for(let i=0;i<900;i++){enemies.update(w,p,1/60,0);if(e.data.encounterState==='telegraph')warned=true;for(const ev of w.events.splice(0)){if(ev.type==='projectileSpawned'){assert.ok(warned,'must warn before firing');shots.push(i);}}}
 assert.ok(shots.length>=6);assert.ok(new Set(shots).size>=3,'volleys must span time');
});
test('fixed surface enemy follows exact scroll and holds when camera holds',()=>{const {w,p,enemies}=scene();const e=enemies.spawn(w,'aa-turret',440,180);enemies.update(w,p,1/60,1.47);assert.ok(Math.abs(e.y-181.47)<1e-8);enemies.update(w,p,1/60,0);assert.ok(Math.abs(e.y-181.47)<1e-8);});
test('dead enemy cancels delayed attack emission',()=>{const {w,p,enemies}=scene();const e=enemies.spawn(w,'armoured-bomber',576,-50);for(let i=0;i<330;i++)enemies.update(w,p,1/60,0);e.active=false;const count=w.projectiles.size;for(let i=0;i<180;i++)enemies.update(w,p,1/60,0);assert.equal(w.projectiles.size,count);});
