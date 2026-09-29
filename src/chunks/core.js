const W=720,H=1280,TAU=Math.PI*2;
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
const boot=document.getElementById('boot');
const startBtn=document.getElementById('startBtn');
const pulseBtn=document.getElementById('pulseBtn');
const pauseBtn=document.getElementById('pauseBtn');
const scoreEl=document.getElementById('score'),hpEl=document.getElementById('hpText'),hpBar=document.getElementById('hpBar'),rescueEl=document.getElementById('rescues'),warningEl=document.getElementById('warning'),cooldownEl=document.getElementById('cooldown');
ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';

const params=new URLSearchParams(location.search);
let rngSeed=0x71A9E515;
function rnd(){ rngSeed^=rngSeed<<13;rngSeed^=rngSeed>>>17;rngSeed^=rngSeed<<5;return (rngSeed>>>0)/4294967296; }
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t}
function ease(t){return t*t*(3-2*t)}
function dist2(a,b,c,d){const x=a-c,y=b-d;return x*x+y*y}

const img={};
async function loadAssets(){
  const sources={falcon:'assets/falcon.png',fighter:'assets/enemy_fighter.png',bomber:'assets/bomber.png',gunboat:'assets/gunboat.png',turret:'assets/turret.png',module:'assets/boss_module.png',harbour:'assets/harbour_map.png',bossHull:'assets/boss_hull.png'};
  await Promise.all(Object.entries(sources).map(([k,src])=>new Promise((res,rej)=>{const im=new Image(); im.onload=()=>{img[k]=im;res()}; im.onerror=rej; im.src=src;})));
}

const state={running:false,paused:false,t:0,last:0,score:0,rescues:0,hp:100,scroll:0,shake:0,startedAt:0,cycle:0};
const player={x:W*.5,y:H*.80,vx:0,vy:0,targetX:W*.5,targetY:H*.80,bank:0,fireT:0,invuln:0,pulseCd:0,manual:false};
const bullets=[], enemies=[], particles=[], decals=[], pickups=[], missiles=[], rescueSites=[], wrecks=[];
let boss=null;
let pointer=null;

const scenery=[];
(function seedScenery(){
  for(let i=0;i<54;i++){
    const y=i*118+rnd()*50;
    const side=rnd()<.55?'L':'R';
    const types=['rock','rock','container','building','container','tank','crane'];
    scenery.push({y,x:side==='L'?48+rnd()*180:492+rnd()*180,side,type:types[Math.floor(rnd()*types.length)],s:.72+rnd()*.75,r:rnd()*TAU,variant:Math.floor(rnd()*3)});
  }
})();

function rrect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function glowCircle(c,x,y,r,inner,outer='rgba(0,0,0,0)'){
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function poly(c,pts){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();}
function screenY(worldY,span=7200){let y=(worldY+state.scroll)%span; if(y<0)y+=span; return y-400;}

function drawBackground(t){
  drawMapBase();
  drawAtmosphere(t);
}

function drawMapBase(){
  const map=img.harbour; if(!map){ctx.fillStyle='#075064';ctx.fillRect(0,0,W,H);return;}
  const mh=map.height;
  const maxStart=Math.max(0,mh-H);
  const sy=clamp(maxStart-state.scroll,0,maxStart);
  ctx.drawImage(map,0,sy,W,H,0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'rgba(8,43,65,.12)');
  g.addColorStop(.6,'rgba(0,20,31,.025)');
  g.addColorStop(1,'rgba(0,12,22,.10)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

function drawAtmosphere(t){
  ctx.save();
  ctx.globalCompositeOperation='multiply';
  for(let i=0;i<4;i++){const x=110+i*205+Math.sin(state.t*.12+i)*45;const y=((i*360+state.scroll*.28)%1700)-180;const g=ctx.createRadialGradient(x,y,0,x,y,180);g.addColorStop(0,'rgba(6,20,28,.18)');g.addColorStop(1,'rgba(6,20,28,0)');ctx.fillStyle=g;ctx.fillRect(x-190,y-150,380,300)}
  ctx.globalCompositeOperation='lighter';
  const pools=[
    [540,((state.scroll+1540)%2050)-560,140,'rgba(50,215,255,.075)'],
    [145,(state.scroll%2400)-650,120,'rgba(255,160,62,.055)'],
    [585,((state.scroll+340)%1900)-760,110,'rgba(94,151,255,.055)']
  ];
  for(const [x,y,r,c] of pools){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
  ctx.globalAlpha=.35;ctx.strokeStyle='#bff7ff';ctx.lineWidth=1.5;
  for(let i=0;i<18;i++){const y=((i*89+state.scroll*.52)%1460)-80;const x=150+((i*131)%420);ctx.beginPath();ctx.moveTo(x-18,y);ctx.quadraticCurveTo(x,y-4,x+18,y);ctx.stroke()}
  ctx.restore();
}

function coastX(y,left){
  const wy=y-state.scroll;
  const base=left?95:650;
  const amp=left?62:38;
  const v=Math.sin(wy*.0024)*amp+Math.sin(wy*.0063+1.4)*22+Math.sin(wy*.0009+3)*26;
  return left?base+v:base-v;
}
function drawCoast(left,t){
  const pts=[];for(let y=-80;y<=H+80;y+=45)pts.push([coastX(y,left),y]);
  ctx.save();
  ctx.beginPath(); if(left){ctx.moveTo(-80,-80);ctx.lineTo(pts[0][0],pts[0][1]);pts.forEach(p=>ctx.lineTo(...p));ctx.lineTo(-80,H+80)}
  else{ctx.moveTo(W+80,-80);ctx.lineTo(pts[0][0],pts[0][1]);pts.forEach(p=>ctx.lineTo(...p));ctx.lineTo(W+80,H+80)}ctx.closePath();
  const land=ctx.createLinearGradient(left?0:W,left?0:W/2,left?260:W-260,0);land.addColorStop(0,'#5b5543');land.addColorStop(.55,'#766d4d');land.addColorStop(1,'#8d825a');ctx.fillStyle=land;ctx.fill();
  ctx.clip();ctx.globalAlpha=.32;ctx.strokeStyle='#383c35';ctx.lineWidth=2;
  for(let i=0;i<45;i++){const yy=((i*97+state.scroll*.86)%1500)-100;const xx=(left?20:W-20)+(left?1:-1)*(25+(i*37)%180);ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+(left?1:-1)*(25+((i*17)%42)),yy+18);ctx.lineTo(xx+(left?1:-1)*(8+((i*11)%35)),yy+46);ctx.stroke()}
  ctx.restore();
  ctx.save();ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,21,27,.55)';ctx.lineWidth=16;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();
  ctx.strokeStyle='rgba(129,235,228,.42)';ctx.lineWidth=5;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();
  ctx.strokeStyle='rgba(228,255,245,.45)';ctx.lineWidth=1.5;ctx.beginPath();pts.forEach((p,i)=>{const off=left?7:-7;i?ctx.lineTo(p[0]+off,p[1]):ctx.moveTo(p[0]+off,p[1])});ctx.stroke();ctx.restore();
}
function drawUnderwaterRidges(t){ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle='#8be4e6';for(let i=0;i<12;i++){const y=((i*151+state.scroll*.6)%1600)-120;ctx.lineWidth=1+(i%3);ctx.beginPath();ctx.moveTo(180,y);ctx.bezierCurveTo(275,y+50,445,y-40,560,y+22);ctx.stroke()}ctx.restore();}

function drawIslandClusters(t){
  const sets=[
    {x:520,y:((state.scroll+420)%1850)-520,s:1.05},
    {x:248,y:((state.scroll+1180)%2300)-620,s:.78},
    {x:585,y:((state.scroll+1800)%2700)-760,s:.63}
  ];
  for(const q of sets){
    if(q.y<-180||q.y>H+180) continue;
    ctx.save(); ctx.translate(q.x,q.y); ctx.scale(q.s,q.s);
    ctx.fillStyle='rgba(0,10,15,.44)'; ctx.beginPath(); ctx.ellipse(13,26,102,58,-.15,0,TAU); ctx.fill();
    const g=ctx.createLinearGradient(-70,-55,70,70); g.addColorStop(0,'#8f8562');g.addColorStop(.45,'#686751');g.addColorStop(1,'#3e5049');
    ctx.fillStyle=g; poly(ctx,[[-96,4],[-70,-47],[-16,-69],[55,-53],[94,-12],[76,45],[22,67],[-46,58]]); ctx.fill();
    ctx.strokeStyle='rgba(209,217,179,.28)';ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle='rgba(18,34,31,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-62,-37);ctx.lineTo(-14,-5);ctx.lineTo(-45,35);ctx.moveTo(19,-48);ctx.lineTo(42,-9);ctx.lineTo(74,17);ctx.stroke();
    ctx.strokeStyle='rgba(171,246,226,.46)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,93,.2,2.9);ctx.stroke();
    ctx.fillStyle='#30393c';ctx.fillRect(-30,-18,58,36);ctx.fillStyle='#6f7d7e';ctx.fillRect(-24,-24,48,12);
    ctx.fillStyle='#f3b957';for(const lx of [-17,17]){ctx.beginPath();ctx.arc(lx,-20,3,0,TAU);ctx.fill();}
    ctx.restore();
  }
}

function drawScenery(t){
  for(const o of scenery){const y=screenY(o.y);if(y<-140||y>H+150)continue; const x=o.x,s=o.s;
    if((o.side==='L'&&x>coastX(y,true)+50)||(o.side==='R'&&x<coastX(y,false)-50))continue;
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(o.r*.12);
    ctx.save();ctx.translate(12,18);ctx.globalAlpha=.42;ctx.fillStyle='#001016';ctx.beginPath();ctx.ellipse(0,0,44,27,0,0,TAU);ctx.fill();ctx.restore();
    if(o.type==='rock')drawRock(o.variant);else if(o.type==='container')drawContainer(o.variant);else if(o.type==='building')drawBuilding(o.variant);else if(o.type==='tank')drawTank();else drawCrane();ctx.restore();
  }
}
function drawRock(v){ctx.fillStyle=v===0?'#4e4f44':v===1?'#666354':'#454b46';poly(ctx,[[-38,6],[-17,-30],[18,-38],[42,-8],[28,26],[-9,38]]);ctx.fill();ctx.strokeStyle='rgba(196,191,159,.3)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,-25);ctx.lineTo(8,4);ctx.lineTo(30,-9);ctx.stroke();}
function drawContainer(v){const c=['#7a4636','#40566a','#6b6a48'][v%3];ctx.fillStyle='rgba(0,0,0,.42)';ctx.fillRect(-34,-7,88,46);ctx.fillStyle='rgba(28,34,35,.8)';poly(ctx,[[44,-26],[54,-17],[54,28],[44,20]]);ctx.fill();ctx.fillStyle=c;ctx.fillRect(-44,-26,88,46);ctx.fillStyle='rgba(255,255,255,.13)';poly(ctx,[[-44,-26],[-34,-34],[54,-25],[44,-18]]);ctx.fill();ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(-40,-22,80,5);ctx.strokeStyle='rgba(20,26,30,.65)';for(let x=-35;x<40;x+=14){ctx.beginPath();ctx.moveTo(x,-20);ctx.lineTo(x,14);ctx.stroke()}ctx.strokeStyle='rgba(224,226,211,.3)';ctx.strokeRect(-44,-26,88,46)}
function drawBuilding(v){ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(-39,-27,83,76);ctx.fillStyle=v%2?'#606970':'#74746a';ctx.fillRect(-48,-43,82,72);ctx.fillStyle='#303a3f';ctx.fillRect(-40,-35,66,9);ctx.fillRect(-40,0,66,7);ctx.fillStyle='#c79d55';for(let x=-34;x<20;x+=18)ctx.fillRect(x,-23,8,8);ctx.strokeStyle='rgba(255,255,255,.15)';ctx.strokeRect(-48,-43,82,72)}
function drawTank(){ctx.fillStyle='#53594c';ctx.beginPath();ctx.ellipse(0,0,38,38,0,0,TAU);ctx.fill();ctx.fillStyle='#252e2d';ctx.beginPath();ctx.ellipse(0,0,26,26,0,0,TAU);ctx.fill();ctx.strokeStyle='#7d8f83';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#9aa69a';ctx.fillRect(-5,-48,10,50);}
function drawCrane(){ctx.strokeStyle='#3a474a';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-26,40);ctx.lineTo(-8,-46);ctx.lineTo(52,-46);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#a37736';ctx.beginPath();ctx.moveTo(-8,-46);ctx.lineTo(49,1);ctx.moveTo(49,-46);ctx.lineTo(-2,0);ctx.stroke();}
