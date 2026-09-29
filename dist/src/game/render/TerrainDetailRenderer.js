function hash(n){return ((Math.sin(n*12.9898+78.233)*43758.5453123)%1+1)%1;}
function bounds(points){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of points??[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}return{minX,minY,maxX,maxY};}
function trace(ctx,points){ctx.beginPath();if(!points?.length)return;ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();}
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x))yes=!yes;}return yes;}

function materialPalette(kind){
 if(kind.includes('snow'))return {light:'rgba(247,250,247,.42)',mid:'rgba(169,177,172,.24)',dark:'rgba(60,70,70,.22)'};
 if(kind.includes('harbour'))return {light:'rgba(224,216,190,.20)',mid:'rgba(101,105,99,.20)',dark:'rgba(34,48,48,.24)'};
 if(kind.includes('limestone'))return {light:'rgba(235,220,181,.32)',mid:'rgba(148,132,101,.23)',dark:'rgba(55,67,59,.23)'};
 return {light:'rgba(213,207,181,.22)',mid:'rgba(113,111,94,.20)',dark:'rgba(44,55,52,.22)'};
}


function drawHarbourInfrastructure(ctx,zone,b,seed,scale){
 const kind=zone.kind??'';
 if(!/(harbour|industrial|naval)/.test(kind))return;
 const w=b.maxX-b.minX,h=b.maxY-b.minY;
 const heavy=/(industrial|naval)/.test(kind);
 const serviceLane={spacing:heavy?72:92,width:heavy?3.2:2.4};
 const containerStack={count:heavy?18:8,width:heavy?28:22,height:heavy?12:9};
 const utilityPad={count:heavy?8:4,size:heavy?34:28};
 ctx.save();
 ctx.globalAlpha=.72;
 ctx.strokeStyle='rgba(221,205,141,.52)';ctx.lineWidth=serviceLane.width*scale;
 for(let i=0;i<Math.max(3,Math.floor(w/serviceLane.spacing));i++){
  const x=b.minX+36+i*serviceLane.spacing+(hash(seed+i*23)-.5)*20;
  ctx.setLineDash([26*scale,18*scale]);ctx.beginPath();ctx.moveTo(x,b.minY+18);ctx.lineTo(x+(hash(seed+i*17)-.5)*28,b.maxY-18);ctx.stroke();
 }
 ctx.setLineDash([]);
 for(let i=0;i<containerStack.count;i++){
  const x=b.minX+24+hash(seed+100+i*29)*Math.max(1,w-48),y=b.minY+28+hash(seed+200+i*31)*Math.max(1,h-56);
  if(!inside(x,y,zone.points??[]))continue;
  const ww=containerStack.width*(.75+.45*hash(seed+i*7)),hh=containerStack.height*(.72+.42*hash(seed+i*11));
  ctx.fillStyle=i%3===0?'rgba(108,66,49,.72)':i%3===1?'rgba(68,92,94,.72)':'rgba(131,115,74,.70)';ctx.fillRect(x-ww/2,y-hh/2,ww,hh);
  ctx.strokeStyle='rgba(236,226,193,.26)';ctx.lineWidth=1;ctx.strokeRect(x-ww/2,y-hh/2,ww,hh);
 }
 for(let i=0;i<utilityPad.count;i++){
  const x=b.minX+30+hash(seed+400+i*37)*Math.max(1,w-60),y=b.minY+30+hash(seed+500+i*41)*Math.max(1,h-60);
  if(!inside(x,y,zone.points??[]))continue;
  const r=utilityPad.size*(.68+.35*hash(seed+i*13));
  ctx.fillStyle='rgba(49,61,62,.48)';ctx.fillRect(x-r*.55,y-r*.34,r*1.1,r*.68);
  ctx.strokeStyle='rgba(188,197,187,.36)';ctx.strokeRect(x-r*.55,y-r*.34,r*1.1,r*.68);
  if(heavy){ctx.beginPath();ctx.arc(x,y,r*.15,0,Math.PI*2);ctx.fillStyle='rgba(188,196,184,.48)';ctx.fill();}
 }
 ctx.restore();
}

/** Deterministic material wear and strata registered to authored world polygons. */
export function drawMaterialZones(ctx,zones,scroll=0){
 if(!ctx||!Array.isArray(zones))return;
 for(const zone of zones){const pts=zone.points??[];if(pts.length<3)continue;const b=bounds(pts),seed=Number(zone.seed??zone.id?.length??1),opacity=Math.max(0,Math.min(.65,Number(zone.opacity??.2))),scale=Math.max(.35,Number(zone.scale??1)),pal=materialPalette(zone.kind??'');
  ctx.save();ctx.translate(0,scroll);trace(ctx,pts);ctx.clip();ctx.globalAlpha=opacity;
  const diagonal=(b.maxX-b.minX)*.32;
  ctx.strokeStyle=pal.dark;ctx.lineWidth=2.2*scale;
  for(let i=0;i<9;i++){const y=b.minY+(i+.35)*(b.maxY-b.minY)/9+(hash(seed+i*7)-.5)*32;ctx.beginPath();ctx.moveTo(b.minX-40,y);ctx.lineTo(b.maxX+40,y-diagonal*(.08+.07*hash(seed+i*11)));ctx.stroke();}
  const count=Math.min(90,Math.max(14,Math.round((b.maxX-b.minX)*(b.maxY-b.minY)/26000)));
  for(let i=0;i<count;i++){const x=b.minX+hash(seed+i*17+2)*(b.maxX-b.minX),y=b.minY+hash(seed+i*31+5)*(b.maxY-b.minY);if(!inside(x,y,pts))continue;const r=(2+hash(seed+i*13)*8)*scale;ctx.fillStyle=i%3===0?pal.light:i%3===1?pal.mid:pal.dark;ctx.beginPath();ctx.ellipse(x,y,r,r*(.28+.42*hash(seed+i*19)),hash(seed+i*23)*2.2,0,Math.PI*2);ctx.fill();}
  drawHarbourInfrastructure(ctx,zone,b,seed,scale);
  ctx.restore();
 }
}

function drawPine(ctx,x,y,size,snow){
 ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(8,19,17,.30)';ctx.beginPath();ctx.ellipse(size*.22,size*.30,size*.50,size*.19,-.35,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=snow?'#31483f':'#183e2a';for(let layer=0;layer<3;layer++){const top=-size+layer*size*.28,w=size*(.42-layer*.04),base=size*(.15+layer*.20);ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(-w,base);ctx.lineTo(w,base);ctx.closePath();ctx.fill();}
 if(snow){ctx.strokeStyle='rgba(239,247,245,.78)';ctx.lineWidth=Math.max(1.2,size*.07);ctx.beginPath();ctx.moveTo(-size*.03,-size*.82);ctx.lineTo(-size*.27,-size*.08);ctx.moveTo(size*.02,-size*.53);ctx.lineTo(size*.26,size*.04);ctx.stroke();}
 ctx.restore();
}
function drawScrub(ctx,x,y,size,seed){ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(8,20,14,.25)';ctx.beginPath();ctx.ellipse(5,7,size*.9,size*.38,.2,0,Math.PI*2);ctx.fill();for(let k=0;k<4;k++){const a=hash(seed+k*5)*Math.PI*2,r=size*(.15+.28*hash(seed+k*7)),rr=size*(.28+.15*hash(seed+k*11));ctx.fillStyle=k%2?'rgba(43,101,53,.88)':'rgba(31,82,45,.90)';ctx.beginPath();ctx.ellipse(Math.cos(a)*r,Math.sin(a)*r*.5,rr,rr*.67,a*.2,0,Math.PI*2);ctx.fill();}ctx.restore();}

/** Deterministic vegetation masses authored by zone instead of uniform random land noise. */
export function drawVegetationZones(ctx,zones,scroll=0){
 if(!ctx||!Array.isArray(zones))return;
 for(const zone of zones){const pts=zone.points??[];if(pts.length<3)continue;const b=bounds(pts),seed=Number(zone.seed??zone.id?.length??1),density=Math.max(.05,Math.min(1,Number(zone.density??.4))),min=Math.max(3,Number(zone.minSize??8)),max=Math.max(min,Number(zone.maxSize??24));
  const area=(b.maxX-b.minX)*(b.maxY-b.minY),count=Math.min(150,Math.max(8,Math.round(area/17000*density)));
  ctx.save();ctx.translate(0,scroll);trace(ctx,pts);ctx.clip();
  for(let i=0;i<count;i++){const x=b.minX+hash(seed+i*17+1)*(b.maxX-b.minX),y=b.minY+hash(seed+i*29+3)*(b.maxY-b.minY);if(!inside(x,y,pts))continue;const size=min+(max-min)*hash(seed+i*37+7);if((zone.kind??'').includes('pine'))drawPine(ctx,x,y,size,(zone.kind??'').includes('snow'));else drawScrub(ctx,x,y,size,seed+i*41);}
  ctx.restore();
 }
}

/** Large authored terrain cast shadows; offsets are world-space and stay locked while camera pans. */
export function drawTerrainShadows(ctx,zones,scroll=0){
 if(!ctx||!Array.isArray(zones))return;
 for(const zone of zones){const pts=zone.points??[];if(pts.length<3)continue;ctx.save();ctx.translate(Number(zone.offsetX??32),scroll+Number(zone.offsetY??48));ctx.globalAlpha=Math.max(0,Math.min(.55,Number(zone.opacity??.2)));ctx.fillStyle='rgba(7,17,20,.94)';const blur=Math.max(0,Math.min(32,Number(zone.blur??0)));if(blur)ctx.filter=`blur(${blur}px)`;trace(ctx,pts);ctx.fill();ctx.restore();}
}
