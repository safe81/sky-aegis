function spawnFighter(x=-1,y=-110,elite=false){const e={type:'fighter',x:(x<0?100+rnd()*520:x),y,vx:(rnd()-.5)*35,vy:95+rnd()*35,hp:elite?95:60,max:elite?95:60,fire:1+rnd()*1.2,phase:rnd()*TAU,elite,rad:25,dead:false};enemies.push(e);return e;}
function spawnBomber(x=W*.5){const e={type:'bomber',x,y:-160,vx:0,vy:48,hp:240,max:240,fire:1.8,phase:rnd()*TAU,rad:58,dead:false};enemies.push(e);return e;}
function spawnGunboat(x=480){const e={type:'gunboat',x,y:-220,vx:0,vy:58,hp:175,max:175,fire:1.3,phase:rnd()*TAU,rad:50,dead:false};enemies.push(e);return e;}
function spawnTurret(x=130){const e={type:'turret',x,y:-100,vx:0,vy:72,hp:110,max:110,fire:1.1,phase:0,rad:38,dead:false,ground:true};enemies.push(e);return e;}
function spawnRescue(x){rescueSites.push({x,y:-50,p:0,done:false,life:18});}
function spawnBoss(){boss={x:W/2,y:-310,targetY:205,hp:2600,max:2600,t:0,fire:1.1,phase:0,dead:false,modules:[-1.7,-.85,0,.85,1.7].map((a,i)=>({a,hp:i===2?850:440,max:i===2?850:440,dead:false}))};}

function resetCycle(){state.cycle=0;state.t=0;state.scroll=0;state.score=0;state.rescues=0;state.hp=100;player.x=W*.5;player.y=H*.80;player.targetX=player.x;player.targetY=player.y;player.pulseCd=0;player.invuln=0;bullets.length=enemies.length=particles.length=decals.length=pickups.length=missiles.length=rescueSites.length=wrecks.length=0;boss=null;spawnRescue(520)}

function director(dt){
  const c=state.t;
  state.cycle+=dt;
  const events=[
    [1.0,'f',120],[1.5,'f',220],[2.0,'f',360],[2.5,'f',500],[3.0,'f',600],
    [5.2,'turret',145],[5.55,'f',300],[5.8,'f',420],[6.0,'f',500],[6.3,'f',590],
    [8.0,'gunboat',520],[8.6,'f',150],[9.0,'f',260],[9.4,'f',380],[9.8,'f',500],
    [12.4,'bomber',360],[13.0,'f',130],[13.5,'f',590],
    [17.0,'rescue',170],[18.2,'f',220],[18.4,'f',360],[18.6,'f',500],
    [22.0,'gunboat',210],[23.0,'turret',590],[24.0,'bomber',430],
    [28.0,'f',120],[28.2,'f',240],[28.4,'f',360],[28.6,'f',480],[28.8,'f',600],
    [33.0,'rescue',510],[34.0,'bomber',190],[34.6,'bomber',530],
    [39.0,'f',170],[39.2,'f',270],[39.4,'f',450],[39.6,'f',550],
    [43.0,'boss',0]
  ];
  for(const ev of events){const key='e'+ev[0]+ev[1];if(c>=ev[0]&&!director[key]){director[key]=1; if(ev[1]==='f')spawnFighter(ev[2]);else if(ev[1]==='turret')spawnTurret(ev[2]);else if(ev[1]==='gunboat')spawnGunboat(ev[2]);else if(ev[1]==='bomber')spawnBomber(ev[2]);else if(ev[1]==='rescue')spawnRescue(ev[2]);else if(ev[1]==='boss')spawnBoss();}}
  if(c>68){for(const k in director)if(k[0]==='e')delete director[k]; resetCycle();}
}

function firePlayer(){bullets.push({friendly:true,x:player.x-13,y:player.y-38,vx:-12,vy:-760,life:1.4,rad:6,damage:9});bullets.push({friendly:true,x:player.x+13,y:player.y-38,vx:12,vy:-760,life:1.4,rad:6,damage:9});particles.push({type:'muzzle',x:player.x-13,y:player.y-40,life:.07,max:.07,size:14});particles.push({type:'muzzle',x:player.x+13,y:player.y-40,life:.07,max:.07,size:14}); if(Math.floor(state.t*4)%13===0){missiles.push({friendly:true,x:player.x,y:player.y-10,vx:(rnd()-.5)*20,vy:-280,life:3,target:null});}}
function fireEnemy(e){
  particles.push({type:'enemyMuzzle',x:e.x,y:e.y+(e.type==='gunboat'?-34:18),life:.09,max:.09,size:e.type==='bomber'?24:17});
  const dx=player.x-e.x,dy=player.y-e.y,mag=Math.hypot(dx,dy)||1;const speed=e.type==='bomber'?250:310;
  if(e.type==='fighter'){for(let s of [-.15,.15]){const a=Math.atan2(dy,dx)+s;bullets.push({friendly:false,x:e.x+s*50,y:e.y+20,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4,rad:7,damage:8})}}
  else if(e.type==='turret'){const a=Math.atan2(dy,dx);for(let s of [-.22,0,.22])bullets.push({friendly:false,x:e.x,y:e.y,vx:Math.cos(a+s)*285,vy:Math.sin(a+s)*285,life:5,rad:8,damage:10});}
  else if(e.type==='gunboat'){const a=Math.atan2(dy,dx);bullets.push({friendly:false,x:e.x-18,y:e.y-34,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:5,rad:9,damage:10});bullets.push({friendly:false,x:e.x+18,y:e.y-34,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:5,rad:9,damage:10});}
  else if(e.type==='bomber'){for(let i=-2;i<=2;i++){const a=Math.PI/2+i*.20;bullets.push({friendly:false,x:e.x,y:e.y+20,vx:Math.cos(a)*230,vy:Math.sin(a)*230,life:5,rad:8,damage:9})}}
}

function update(dt){
  if(!state.running||state.paused)return;
  state.t+=dt;state.scroll+=dt*116;director(dt);
  player.invuln=Math.max(0,player.invuln-dt);player.pulseCd=Math.max(0,player.pulseCd-dt);
  if(!player.manual){player.targetX=W*.5+Math.sin(state.t*.63)*170+Math.sin(state.t*1.37)*48;player.targetY=H*.80+Math.sin(state.t*.47)*72;}
  const dx=player.targetX-player.x,dy=player.targetY-player.y;const max=dt*600;const d=Math.hypot(dx,dy);const m=d>max?max/d:1;const nx=dx*m,ny=dy*m;player.vx=lerp(player.vx,nx/Math.max(dt,.001),.18);player.vy=lerp(player.vy,ny/Math.max(dt,.001),.18);player.x=clamp(player.x+nx,48,W-48);player.y=clamp(player.y+ny,220,H-95);player.bank=lerp(player.bank,clamp(player.vx/520,-1,1),.12);
  player.fireT-=dt;if(player.fireT<=0){player.fireT=.105;firePlayer()}

  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.phase+=dt;e.y+=e.vy*dt;e.x+=e.vx*dt+(e.type==='fighter'?Math.sin(e.phase*2.1)*16*dt:0);e.fire-=dt;if(e.fire<=0&&e.y>30&&e.y<H*.72){fireEnemy(e);e.fire=(e.type==='fighter'?1.35:e.type==='turret'?1.7:e.type==='gunboat'?1.55:2.1)+rnd()*.45;}if(!e.dead&&e.hp<e.max*.62&&rnd()<dt*5.2)particles.push({type:'smoke',x:e.x+(rnd()-.5)*24,y:e.y+(rnd()-.5)*20,vx:(rnd()-.5)*16,vy:-18-rnd()*18,life:1.1+rnd()*.8,max:1.9,size:14+rnd()*16});if(e.y>H+240||e.dead)enemies.splice(i,1)}
  if(boss){boss.t+=dt;if(boss.y<boss.targetY)boss.y+=90*dt;else{boss.x=W*.5+Math.sin(boss.t*.45)*85;boss.fire-=dt;if(boss.fire<=0){boss.fire=.65;const live=boss.modules.filter(m=>!m.dead);live.forEach((m,j)=>{const p=bossModulePos(m);const count=(j%2?3:2);for(let q=0;q<count;q++){const a=Math.PI/2+(q-(count-1)/2)*.22+Math.sin(boss.t*.6)*.08;bullets.push({friendly:false,x:p.x,y:p.y+20,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:6,rad:8,damage:10})}});}}
    for(const m of boss.modules){if(!m.dead&&m.hp<m.max*.55&&rnd()<dt*4.4){const p=bossModulePos(m);particles.push({type:'smoke',x:p.x+(rnd()-.5)*18,y:p.y+(rnd()-.5)*14,vx:(rnd()-.5)*12,vy:-18-rnd()*14,life:1.2+rnd()*.8,max:2,size:16+rnd()*18})}}
    if(boss.hp<=0&&!boss.dead){boss.dead=true;bossDeath();}
  }

  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    if(b.friendly){
      let hit=false;
      for(const e of enemies){
        if(!e.dead && dist2(b.x,b.y,e.x,e.y)<(e.rad+8)**2){
          e.hp-=b.damage; hit=true; hitSpark(b.x,b.y,'metal');
          if(e.hp<=0){e.dead=true; destroyEnemy(e)}
          break;
        }
      }
      if(!hit && boss && !boss.dead && boss.y>0){
        for(const m of boss.modules){
          if(m.dead) continue;
          const p=bossModulePos(m);
          if(dist2(b.x,b.y,p.x,p.y)<(38+8)**2){
            m.hp-=b.damage; boss.hp-=b.damage; hit=true; hitSpark(b.x,b.y,'boss');
            if(m.hp<=0){m.dead=true; moduleDeath(p.x,p.y)}
            break;
          }
        }
      }
      if(hit) b.life=0;
    } else if(player.invuln<=0 && dist2(b.x,b.y,player.x,player.y)<(15+b.rad)**2){
      state.hp=Math.max(0,state.hp-b.damage);
      player.invuln=.7; state.shake=8; hitSpark(player.x,player.y,'player'); b.life=0;
      if(state.hp<=0){state.hp=100; player.invuln=2; explosion(player.x,player.y,'air',1.2)}
    }
    if(b.life<=0||b.y<-100||b.y>H+100||b.x<-100||b.x>W+100) bullets.splice(i,1);
  }
  for(let i=missiles.length-1;i>=0;i--){const m=missiles[i];m.life-=dt;if(m.friendly){if(!m.target||m.target.dead)m.target=enemies.find(e=>!e.dead&&e.y>80)||null;if(m.target){const a=Math.atan2(m.target.y-m.y,m.target.x-m.x);m.vx=lerp(m.vx,Math.cos(a)*380,.045);m.vy=lerp(m.vy,Math.sin(a)*380,.045)}}m.x+=m.vx*dt;m.y+=m.vy*dt;particles.push({type:'trail',x:m.x,y:m.y+7,vx:-m.vx*.02+(rnd()-.5)*12,vy:-m.vy*.02+20,life:.55,max:.55,size:5+rnd()*4});if(m.target&&dist2(m.x,m.y,m.target.x,m.target.y)<(m.target.rad+12)**2){m.target.hp-=50;explosion(m.x,m.y,m.target.type==='gunboat'?'water':'air',.45);if(m.target.hp<=0){m.target.dead=true;destroyEnemy(m.target)}m.life=0}if(m.life<=0||m.y<-100)missiles.splice(i,1)}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.type==='spark'){p.vy+=260*dt;p.vx*=.992}else if(p.type==='smoke'){p.vy-=6*dt;p.size+=12*dt}else if(p.type==='debris'){p.vy+=140*dt;p.r+=(p.spin||0)*dt}else if(p.type==='splash'){p.vy+=420*dt}else if(p.type==='fireball'){p.vx*=.97;p.vy*=.97}if(p.life<=0)particles.splice(i,1)}
  for(let i=decals.length-1;i>=0;i--){decals[i].y+=116*dt;decals[i].life-=dt;if(decals[i].life<=0||decals[i].y>H+100)decals.splice(i,1)}
  for(let i=wrecks.length-1;i>=0;i--){wrecks[i].y+=116*dt;wrecks[i].life-=dt;if(wrecks[i].life<=0||wrecks[i].y>H+180)wrecks.splice(i,1)}
  for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.y+=90*dt;const d=Math.hypot(player.x-p.x,player.y-p.y);if(d<145){p.x+=(player.x-p.x)*dt*4;p.y+=(player.y-p.y)*dt*4}if(d<28){state.score+=p.value;collectBurst(p.x,p.y);pickups.splice(i,1)}else if(p.y>H+50)pickups.splice(i,1)}
  for(let i=rescueSites.length-1;i>=0;i--){const r=rescueSites[i];r.y+=116*dt;r.life-=dt;if(!r.done&&Math.hypot(player.x-r.x,player.y-r.y)<72){r.p=clamp(r.p+dt*.65,0,1);if(r.p>=1){r.done=true;state.rescues++;state.score+=500;collectBurst(r.x,r.y)}}else if(!r.done)r.p=Math.max(0,r.p-dt*.16);if(r.y>H+80||r.life<=0)rescueSites.splice(i,1)}
  state.shake=Math.max(0,state.shake-dt*30);
  updateHud();
}

function bossModulePos(m){const radius=m.a===0?0:Math.abs(m.a)>1.2?198:112;const x=boss.x+Math.sin(m.a)*radius;const y=boss.y+Math.abs(m.a)*22+45;return {x,y};}
function destroyEnemy(e){state.score+=e.type==='fighter'?120:e.type==='turret'?260:e.type==='gunboat'?420:650;const kind=e.type==='gunboat'?'water':e.type==='turret'?'ground':'air';explosion(e.x,e.y,kind,e.type==='bomber'?1.15:e.type==='fighter'?.72:.95);if(e.type==='gunboat'||e.type==='turret')wrecks.push({type:e.type,x:e.x,y:e.y,life:10,max:10,r:(rnd()-.5)*.3});for(let k=0;k<(e.type==='fighter'?2:5);k++)pickups.push({x:e.x+(rnd()-.5)*24,y:e.y+(rnd()-.5)*20,value:25});}
function hitSpark(x,y,kind){for(let i=0;i<7;i++){const a=rnd()*TAU,sp=80+rnd()*220;particles.push({type:'spark',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.2+rnd()*.3,max:.5,size:1+rnd()*2,c:kind==='player'?'#8af3ff':'#ffd27a'})}particles.push({type:'flash',x,y,life:.08,max:.08,size:18});}
function explosion(x,y,kind='air',scale=1){
  state.shake=Math.max(state.shake,4*scale);
  particles.push({type:'eventLight',x,y,life:.26,max:.26,size:155*scale});
  particles.push({type:'flash',x,y,life:.13,max:.13,size:68*scale});
  particles.push({type:'ring',x,y,life:.35,max:.35,size:18*scale});
  for(let i=0;i<Math.ceil(5*scale);i++){
    const a=rnd()*TAU, rr=(6+rnd()*22)*scale;
    particles.push({type:'fireball',x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr*.7,vx:Math.cos(a)*(15+rnd()*35),vy:Math.sin(a)*(12+rnd()*28),life:.38+rnd()*.30,max:.68,size:(23+rnd()*30)*scale,phase:rnd()});
  }
  const sparks=Math.floor(24*scale);for(let i=0;i<sparks;i++){const a=rnd()*TAU,sp=(90+rnd()*320)*scale;particles.push({type:'spark',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.28+rnd()*.52,max:.8,size:1.4+rnd()*2.8,c:rnd()<.55?'#ffd06a':'#ff783f'})}
  for(let i=0;i<Math.ceil(8*scale);i++){particles.push({type:'smoke',x:x+(rnd()-.5)*28*scale,y:y+(rnd()-.5)*20*scale,vx:(rnd()-.5)*38,vy:(rnd()-.5)*28,life:1.25+rnd()*.95,max:2.2,size:(20+rnd()*20)*scale})}
  for(let i=0;i<Math.ceil(5*scale);i++){const a=rnd()*TAU,sp=45+rnd()*130;particles.push({type:'debris',x:x+(rnd()-.5)*16,y:y+(rnd()-.5)*16,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.9+rnd()*.8,max:1.7,size:(4+rnd()*9)*scale,r:rnd()*TAU,spin:(rnd()-.5)*9})}
  if(kind==='water'){for(let i=0;i<20*scale;i++){const a=-Math.PI+rnd()*Math.PI,sp=90+rnd()*190;particles.push({type:'splash',x,y,vx:Math.cos(a)*sp,vy:-70-rnd()*240,life:.5+rnd()*.55,max:1,size:1+rnd()*3})}particles.push({type:'waterRing',x,y,life:.9,max:.9,size:28*scale});}
  else if(kind==='ground')decals.push({x,y,life:8,max:8,size:36*scale});
}
function moduleDeath(x,y){explosion(x,y,'air',1.1);state.score+=900;}
function bossDeath(){state.score+=8000;for(const m of boss.modules){const p=bossModulePos(m);explosion(p.x,p.y,'air',1.5)}for(let k=0;k<20;k++)setTimeout(()=>{if(state.running)explosion(boss.x+(rnd()-.5)*300,boss.y+(rnd()-.5)*150,'air',.7+rnd())},k*70)}
function collectBurst(x,y){for(let i=0;i<12;i++){const a=rnd()*TAU,s=40+rnd()*140;particles.push({type:'collect',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+rnd()*.25,max:.6,size:2+rnd()*3})}}

function pulse(){if(player.pulseCd>0||!state.running)return;player.pulseCd=18;for(let i=bullets.length-1;i>=0;i--)if(!bullets[i].friendly&&dist2(bullets[i].x,bullets[i].y,player.x,player.y)<230*230)bullets.splice(i,1);particles.push({type:'emp',x:player.x,y:player.y,life:.75,max:.75,size:20});for(const e of enemies)if(dist2(e.x,e.y,player.x,player.y)<230*230)e.hp-=35;state.shake=5;audioPulse();}
