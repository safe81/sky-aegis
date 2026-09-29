import { ENEMY_BY_ID } from '../content/enemies.js';
import { flightPose,cubic } from './EncounterPaths.js';
import { PLAYFIELD_WIDTH } from '../constants.js';
export class EnemySystem {
 ages=new Map();origins=new Map();
 constructor(weapons){this.weapons=weapons;}
 spawn(world,family,x,y,extra={}){
  const def=ENEMY_BY_ID.get(family);if(!def)throw Error(`Unknown enemy family ${family}`);
  const kind=def.domain==='ground'?'ground':def.domain==='naval'?'naval':'enemy';
  const entity=world.spawnEntity({kind,faction:'enemy',x,y,hp:def.hp,radius:def.radius,medalEligible:true,interactiveAssetId:def.id,destructionPreset:def.destructionPreset,data:{enemyId:def.id,domain:def.domain,encounterState:'entrance',...extra}});
  this.ages.set(entity.id,0);this.origins.set(entity.id,{x,y});return entity;
 }
 update(world,player,dt,scrollDelta=88*dt){
  for(const entity of world.entities.values()){
   const id=entity.data.enemyId;if(typeof id!=='string')continue;
   if(!entity.active){this.ages.delete(entity.id);this.origins.delete(entity.id);this.weapons.enemyTimers.delete(entity.id);continue;}
   const def=ENEMY_BY_ID.get(id);if(!def)continue;
   const age=(this.ages.get(entity.id)??0)+dt;this.ages.set(entity.id,age);
   const origin=this.origins.get(entity.id)??{x:entity.x,y:entity.y},px=entity.x,py=entity.y;
   if(def.domain==='air'){
    const pose=flightPose(id,origin,age);entity.x=pose.x;entity.y=pose.y;
    entity.data.encounterState=pose.state;entity.data.phaseTime=pose.phaseTime;entity.data.phaseDuration=pose.phaseDuration;entity.data.attackCycle=pose.attackCycle;
    entity.data.bank=Math.max(-.32,Math.min(.32,(entity.x-px)/Math.max(dt,.001)*.0016));
    if(pose.done)entity.active=false;
   }else{
    entity.y+=scrollDelta;
    if(id==='gunboat'){
     const t=Math.min(1,age/9);entity.x=cubic(origin.x,origin.x-90,origin.x+55,origin.x-45,t);entity.y+=dt*18;
    }
    // Roads are explicit cubic routes in scenery coordinates, attached on spawn.
    if(id==='armoured-vehicle'&&entity.data.route){const r=entity.data.route,t=Math.min(1,(age+(entity.data.routeOffset??0))/18);entity.x=cubic(...r.x,t);entity.y=cubic(...r.y,t)+(Number(world.scrollDistance)||0);entity.data.bank=.05;}
    const tell=def.telegraph,attack=id==='gunboat'?1.7:id==='missile-battery'?1.3:1.0,recover=id==='missile-battery'?2.4:1.35;
    const cycleTime=tell+attack+recover,q=Math.max(0,age-.6),phase=q%cycleTime;
    entity.data.encounterState=age<.6?'position':phase<tell?'telegraph':phase<tell+attack?'attack':'recovery';
    entity.data.phaseTime=phase<tell?phase:phase<tell+attack?phase-tell:phase-tell-attack;
    entity.data.phaseDuration=phase<tell?tell:phase<tell+attack?attack:recover;
    entity.data.attackCycle=Math.floor(q/cycleTime);
   }
   entity.data.motionX=(entity.x-px)/Math.max(dt,.001);entity.data.motionY=(entity.y-py-scrollDelta)/Math.max(dt,.001);
   const target=Math.atan2(player.y-entity.y,player.x-entity.x);
   if(entity.data.encounterState==='telegraph'){
    entity.data.lockX=player.x;entity.data.lockY=player.y;
    entity.data.weaponAngle=target;
   }
   entity.data.telegraphPulse=entity.data.encounterState==='telegraph'?Math.max(.02,entity.data.phaseTime/entity.data.phaseDuration):0;
   if(entity.active&&entity.y>60&&entity.y<1000)this.weapons.updateEnemy(world,entity,def,player,dt);
   if(entity.y>1460||entity.x<-200||entity.x>PLAYFIELD_WIDTH+200)entity.active=false;
  }
 }
}
