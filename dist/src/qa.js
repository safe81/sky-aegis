// Explicit development harness. Scenarios use the same simulation and renderer as play.
import {GameSession} from './game/GameSession.js';
import {AIRCRAFT} from './game/content/aircraft.js';
import {MISSION1_EVENTS} from './game/content/mission1.js';
import {createDefaultProfile} from './game/save/SaveRepository.js';
import {renderPlaying} from './ui/screens.js';
import {blueprintToWorld,scrollForBlueprintRow,scrollLimits} from './game/content/level1Space.js';
import {VIEWPORT_WIDTH} from './game/constants.js';
const params=new URLSearchParams(location.search),mode=params.get('mode')||'timeline';
const width=Math.max(320,Math.min(720,Number(params.get('w'))||430));
const height=Math.max(568,Math.min(1280,Number(params.get('h'))||932));
const host=document.getElementById('qa-host');host.style.width=width+'px';host.style.height=height+'px';
if(params.get('capture')==='1')document.body.classList.add('capture');
const craft=AIRCRAFT.find(c=>c.id===params.get('craft'))||AIRCRAFT.find(c=>c.id==='falcon-07');
host.innerHTML=renderPlaying(craft);
const silent={play(){},stopMusic(){},startMusic(){},suspend(){},resume(){}};
let session,elapsed=0,ended=false,currentCheckpoint=null,checkpointMode='quiet';
let resolveQaReady,rejectQaReady;
const qaReady=new Promise((resolve,reject)=>{resolveQaReady=resolve;rejectQaReady=reject;});
let checkpointRecords=[];
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
async function loadCheckpointRecords(){
 const response=await fetch(new URL('../qa/level1-checkpoints.json',import.meta.url));
 if(!response.ok)throw Error(`Checkpoint manifest failed: ${response.status}`);
 checkpointRecords=await response.json();
}
function quietWorld(){
 for(const [id,e] of [...session.world.entities])if(id!=='player'&&e.faction==='enemy')session.world.entities.delete(id);
 for(const [id,p] of [...session.world.projectiles])if(p.active)session.world.projectiles.delete(id);
}
async function selectCheckpoint(id,options={}){
 const c=checkpointRecords.find(x=>x.id===id);if(!c)throw Error(`Unknown Level 1 checkpoint ${id}`);
 currentCheckpoint=c;checkpointMode=options.mode??'quiet';
 const r=session.renderer,bounds=session.renderer.environment.map.bounds;
 const limits=scrollLimits(r.viewTop,r.viewHeight,bounds);
 const requested=scrollForBlueprintRow(c.sourceCenter.v,c.screenFocusY,r.viewTop);
 const scroll=clamp(requested,limits.min,limits.max);
 session.mission.scrollDistance=scroll;session.world.scrollDistance=scroll;
 const focus=blueprintToWorld(options.camera==='left'?c.sourceReviewBounds.left:options.camera==='right'?c.sourceReviewBounds.right:c.cameraFocusU,c.sourceCenter.v).x;
 const camera=clamp(focus-VIEWPORT_WIDTH/2,bounds.minX,bounds.maxX-VIEWPORT_WIDTH);
 r.cameraX=camera;
 const player=session.world.getEntity('player');if(player){player.x=camera+VIEWPORT_WIDTH/2;player.y=Math.min(1080,r.viewTop+r.viewHeight-120);}
 elapsed=Number.isFinite(options.animationTime)?options.animationTime:c.animationTime;
 if(checkpointMode==='quiet')quietWorld();
 if(options.play){for(let i=0;i<30;i++){session.world.step(1/60);session.effects.consumeEvents(session.world);session.effects.update(1/60,0);elapsed+=1/60;}}
 draw();await new Promise(requestAnimationFrame);draw();
 return sampleCheckpoint();
}
function sampleCheckpoint(){
 if(!session)return null;const r=session.renderer,bounds=r.environment.map.bounds;
 const worldTop=r.viewTop-session.mission.scrollDistance,worldBottom=r.viewTop+r.viewHeight-session.mission.scrollDistance;
 const visibleArt=(r.environment.map.artInstances??[]).filter(i=>i.visualBounds.maxY>=worldTop&&i.visualBounds.minY<=worldBottom&&i.visualBounds.maxX>=r.cameraX&&i.visualBounds.minX<=r.cameraX+VIEWPORT_WIDTH).map(i=>i.id);
 const visibleLandmarks=(r.environment.map.landmarks??[]).filter(i=>i.y+i.height>=worldTop&&i.y<=worldBottom&&i.x+i.width>=r.cameraX&&i.x<=r.cameraX+VIEWPORT_WIDTH).map(i=>i.id);
 return {build:'1.6.0',visualRevision:'level1-visual-r1',mapVersion:r.environment.map.version,checkpointId:currentCheckpoint?.id??null,cameraX:r.cameraX,scrollDistance:session.mission.scrollDistance,viewTop:r.viewTop,viewHeight:r.viewHeight,animationTime:elapsed,seed:currentCheckpoint?.seed??0,backingWidth:r.canvas.width,backingHeight:r.canvas.height,devicePixelRatio:window.devicePixelRatio||1,quality:session.profile.settings.quality,waterBackend:r.scene.water.gl?'WebGL':'Canvas',missingAssets:[...r.cache].filter(([,v])=>!v.ready).map(([k])=>k),cacheBytes:r.scene.cacheBytes??0,visibleFeatureIds:[...new Set([...visibleLandmarks,...visibleArt])],worldBounds:bounds,mode:checkpointMode};
}
window.__LEVEL1_QA__={ready:qaReady,selectCheckpoint:async(id,options)=>{await qaReady;return selectCheckpoint(id,options);},sample:()=>sampleCheckpoint()};
function hud(h){
 const text=(id,v)=>{const e=host.querySelector(`[data-hud="${id}"]`);if(e)e.textContent=v;};
 text('hp',Math.round(h.hp/h.maxHp*100)+'%');text('score',h.score);text('salvage',h.salvage);text('rescue',h.rescued+'/6');
 text('message',h.missionMessage);text('objective',`${h.destroyed} / ${h.eligible} HOSTILES`);
 const bp=host.querySelector('[data-hud-panel="boss"]');bp.hidden=h.bossPhase==='none'||h.bossPhase==='defeated';
 text('boss-name',h.bossPhase==='breakwater'?'BREAKWATER':'LEVIATHAN');text('boss-phase',h.bossPhase);
 host.querySelector('[data-hud-bar="boss"]').style.width=(h.bossMaxHp?h.bossHp/h.bossMaxHp*100:0)+'%';
}
function draw(){
 session.renderer.render({world:session.world,mission:session.mission,craft,effects:session.effects,boss:session.boss,elapsed});
 session.emitHud();const r=session.renderer;
 document.getElementById('qa-status').textContent=`Ready · ${mode} · ${elapsed.toFixed(2)} seconds · ${width} × ${height}${ended?' · mission ended':''}`;
 document.getElementById('qa-metrics').textContent=JSON.stringify({renderer:r.rendererName,modules:r.scene.visible.length,loadedAssets:[...r.cache.values()].filter(v=>v.ready).length,missingAssets:[...r.cache].filter(([k,v])=>!v.ready).map(([k])=>k),water:r.scene.water.gl?'WebGL':'CPU layered',quality:session.profile.settings.quality,costs:{...r.renderCosts,...r.scene.costs},scroll:session.mission.scrollDistance,hostiles:[...session.world.entities.values()].filter(e=>e.active&&e.faction==='enemy').length,projectiles:[...session.world.projectiles.values()].filter(p=>p.active).length,particles:session.effects.particles.length,wrecks:session.effects.wrecks.length,bossPhase:session.boss.phase,viewHeight:r.viewHeight,viewTop:r.viewTop},null,2);
}
function advance(seconds){
 for(let i=0;i<Math.round(seconds*60)&&!ended;i++){
  if(mode==='destruction'||mode==='aftermath'||mode==='quiet'){
   session.world.step(1/60);session.effects.consumeEvents(session.world);session.effects.update(1/60,0);
  }else session.step(1/60);
  elapsed+=1/60;
 }
}
try{
 const profile=createDefaultProfile('review');if(['low','balanced','high'].includes(params.get('quality')))profile.settings.quality=params.get('quality');
 session=new GameSession({container:host.querySelector('#combat-stage'),craft,profile,audio:silent,onHud:hud,onEnd(){ended=true;},onPauseRequest(){}});
 session.renderer.profileLayers=params.get('profile')==='layers';
 session.renderer.mount();await session.renderer.preloadAssets(craft.id);
 await loadCheckpointRecords();
 if(mode==='timeline')advance(Math.max(0,Math.min(110,Number(params.get('time'))||4)));
 if(mode==='quiet'){const qScroll=Math.max(0,Math.min(7825,Number(params.get('scroll'))||0));session.mission.scrollDistance=qScroll;session.world.scrollDistance=qScroll;}
 if(mode==='miniboss'||mode==='boss'){
  const m=session.mission;m.time=mode==='miniboss'?120:210;m.scrollDistance=m.time*35;session.world.scrollDistance=m.scrollDistance;
  m.nextEvent=MISSION1_EVENTS.length;m.holdForMiniboss=mode==='miniboss';m.bossStarted=mode==='boss';m.message=mode==='miniboss'?'BREAKWATER GUNSHIP':'LEVIATHAN INBOUND';
  if(mode==='miniboss')session.boss.spawnBreakwater(session.world,576,210);else session.boss.spawnLeviathan(session.world,576,210);
  advance(Number(params.get('time'))||6.5);
 }
 if(mode==='destruction'||mode==='aftermath'){
  session.mission.scrollDistance=1362.5;session.world.scrollDistance=1362.5;
  const s=session.mission.environment.socketAt('aa-outer-a',1362.5);
  const e=session.enemies.spawn(session.world,'aa-turret',s.x,s.y);session.world.damageEntity(e.id,1000,'player');
  session.effects.consumeEvents(session.world);advance(mode==='aftermath'?2.2:Number(params.get('time'))||.25);
 }
 const requestedCheckpoint=params.get('checkpoint');
 if(requestedCheckpoint)await selectCheckpoint(requestedCheckpoint,{mode:params.get('checkpointMode')||'quiet',camera:params.get('camera')||'center',animationTime:Number(params.get('animationTime'))||undefined,play:params.get('play')==='1'});
 else draw();
 resolveQaReady(session);
 document.getElementById('advance').onclick=()=>{advance(1);draw();};
 document.getElementById('boss-phase').onclick=()=>{
  if(!['boss','miniboss'].includes(mode))return;
  for(const e of session.world.entities.values())if(e.active&&e.kind==='boss'&&e.faction==='enemy')session.world.damageEntity(e.id,100000,'qa-phase-control');
  advance(.25);draw();
 };
 document.getElementById('measure').onclick=async()=>{
  const samples=[],intervals=[];let previous;
  for(let i=0;i<120;i++){const now=await new Promise(requestAnimationFrame);if(previous!==undefined)intervals.push(now-previous);previous=now;const t=performance.now();draw();samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);
  document.getElementById('qa-benchmark').textContent=`120 stationary render samples (cloud browser): draw median ${samples[60].toFixed(1)} ms, p95 ${samples[114].toFixed(1)} ms; frame-interval median ${intervals[59].toFixed(1)} ms, p95 ${intervals[113].toFixed(1)} ms. This is not a physical-device FPS measurement.`;
 };
}catch(error){rejectQaReady?.(error);document.getElementById('qa-status').textContent='FAIL: '+error.message;console.error(error);}
