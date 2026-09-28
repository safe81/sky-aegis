import {PLAYFIELD_WIDTH} from '../constants.js';

export const RELIEF_BASE_ALPHA=0.16;
const WORLD_CENTER_X=PLAYFIELD_WIDTH/2;
function hash(n){return ((Math.sin(n*12.9898+78.233)*43758.5453123)%1+1)%1;}
function bounds(points){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of points??[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};}
function trace(ctx,points,scroll=0){if(!points?.length)return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y+scroll);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y+scroll);ctx.closePath();}
function palette(kind){
 if(kind.includes('snow'))return{top:'#dce4e2',mid:'#818b89',deep:'#394346',line:'rgba(247,252,251,.52)',crack:'rgba(31,43,46,.42)',talus:'rgba(111,121,120,.65)'};
 if(kind.includes('limestone'))return{top:'#d1c7a8',mid:'#988e75',deep:'#4a5047',line:'rgba(239,229,199,.44)',crack:'rgba(47,53,45,.42)',talus:'rgba(112,108,91,.66)'};
 if(kind.includes('harbour'))return{top:'#89907f',mid:'#656c62',deep:'#394342',line:'rgba(205,204,181,.26)',crack:'rgba(30,39,38,.36)',talus:'rgba(79,83,73,.64)'};
 return{top:'#9b9d8e',mid:'#6b6d63',deep:'#30393a',line:'rgba(221,218,198,.34)',crack:'rgba(28,37,38,.40)',talus:'rgba(87,88,77,.65)'};
}

function drawReliefPine(ctx,x,y,size,snow=false){
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='rgba(5,15,14,.32)';ctx.beginPath();ctx.ellipse(size*.18,size*.29,size*.44,size*.16,-.35,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=snow?'#2f493f':'#17422a';
 for(let layer=0;layer<3;layer++){const yy=-size+layer*size*.26,w=size*(.44-layer*.05),base=size*(.12+layer*.19);ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(-w,base);ctx.lineTo(w,base);ctx.closePath();ctx.fill();}
 if(snow){ctx.strokeStyle='rgba(242,248,246,.78)';ctx.lineWidth=Math.max(1,size*.07);ctx.beginPath();ctx.moveTo(-2,-size*.78);ctx.lineTo(-size*.25,-size*.08);ctx.moveTo(1,-size*.50);ctx.lineTo(size*.24,size*.02);ctx.stroke();}
 ctx.restore();
}
function buildRockPolygon(rw,rh,seed){
 const n=8,pts=[];
 for(let k=0;k<n;k++){
  const a=-Math.PI/2+Math.PI*2*k/n;
  const radial=.64+hash(seed+k*29)*.31;
  // Wider shoulders, compressed base, and uneven crown make cliff fragments angular rather than boulder-like.
  const x=Math.cos(a)*rw*radial;
  const y=Math.sin(a)*rh*radial+(k>=3&&k<=5?rh*.08:0);
  pts.push({x,y});
 }
 return pts;
}
function traceLocalPolygon(ctx,pts,ox=0,oy=0){ctx.beginPath();ctx.moveTo(pts[0].x+ox,pts[0].y+oy);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x+ox,pts[i].y+oy);ctx.closePath();}
function drawRockMasses(ctx,zone,b,p,scroll,seed,rough){
 const limestone=(zone.kind??'').includes('limestone'),snow=(zone.kind??'').includes('snow'),harbour=(zone.kind??'').includes('harbour');
 const count=limestone?Math.max(12,Math.floor(b.width/62)):harbour?Math.max(6,Math.floor(b.width/130)):Math.max(12,Math.floor(b.width/72));
 for(let i=0;i<count;i++){
  const west=(b.minX+b.maxX)/2<WORLD_CENTER_X,edgeBias=hash(seed+1460+i*43),uniform=hash(seed+1500+i*37);
  const edgeT=edgeBias<.72?(west?.58+.42*uniform:.42*uniform):uniform;
  const cx=b.minX+edgeT*b.width,cy=b.minY+b.height*(.08+hash(seed+1600+i*41)*.84);
  const rw=(limestone?11:15)+hash(seed+1700+i*31)*(limestone?21:32),rh=(limestone?14:19)+hash(seed+1800+i*29)*(limestone?26:42);
  const rock=buildRockPolygon(rw,rh,seed+i*97),shadow=rock.map(q=>({x:q.x+10,y:q.y+15}));
  ctx.save();ctx.translate(cx,cy+scroll);
  traceLocalPolygon(ctx,shadow);ctx.fillStyle='rgba(20,29,29,.42)';ctx.fill();
  const g=ctx.createLinearGradient(-rw,-rh,rw,rh);g.addColorStop(0,snow?'#d9dfdc':limestone?'#b9ad8b':harbour?'#7c8377':'#8f9185');g.addColorStop(.46,snow?'#7b8582':limestone?'#817861':harbour?'#5c635a':'#62645d');g.addColorStop(1,snow?'#465156':limestone?'#4b5148':'#394343');ctx.fillStyle=g;traceLocalPolygon(ctx,rock);ctx.fill();ctx.strokeStyle=p.line;ctx.lineWidth=1.8;ctx.stroke();
  // Facets split each outcrop into a lit upper-left plane and dark lower-right face.
  const top=rock[0],left=rock[7],right=rock[1],bottom=rock[4];
  ctx.fillStyle=snow?'rgba(244,248,246,.22)':limestone?'rgba(237,222,181,.14)':'rgba(220,220,203,.11)';ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.lineTo(right.x,right.y);ctx.lineTo(0,0);ctx.lineTo(left.x,left.y);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(26,37,37,.18)';ctx.beginPath();ctx.moveTo(right.x,right.y);ctx.lineTo(rock[2].x,rock[2].y);ctx.lineTo(bottom.x,bottom.y);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle=p.crack;ctx.lineWidth=1.35;for(let k=0;k<2;k++){const x0=(-.32+.28*k)*rw,y0=(-.42+.34*k)*rh;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+rw*(.18+hash(seed+i*13+k)*.22),y0+rh*(.38+.18*hash(seed+i*17+k)));ctx.lineTo(x0+rw*(.08+hash(seed+i*19+k)*.18),y0+rh*(.62+.12*hash(seed+i*23+k)));ctx.stroke();}
  if(snow){ctx.fillStyle='rgba(244,248,246,.72)';ctx.beginPath();ctx.moveTo(rock[7].x*.72,rock[7].y*.72);ctx.lineTo(top.x,top.y);ctx.lineTo(rock[1].x*.72,rock[1].y*.72);ctx.lineTo(0,-rh*.22);ctx.closePath();ctx.fill();}
  ctx.restore();
  // Trees prefer upper ledges and pockets between outcrops.
  if(!harbour&&i%2===0){const trees=limestone?2:3;for(let k=0;k<trees;k++){const tx=cx-rw*.34+k*rw*.38+(hash(seed+i*53+k)-.5)*10,ty=cy-rh*.26+(hash(seed+i*61+k)-.5)*16;drawReliefPine(ctx,tx,ty+scroll,9+hash(seed+i*71+k)*12,snow);}}
 }
}



function drawWaterFacingEscarpment(ctx,zone,b,p,scroll,seed){
 const kind=zone.kind??'';if(kind.includes('harbour'))return;
 const west=(b.minX+b.maxX)/2<WORLD_CENTER_X,waterFacingEdge=west?b.maxX:b.minX;
 const segs=Math.max(7,Math.round(b.height/72)),rim=[],toe=[];
 for(let i=0;i<=segs;i++){
  const y=b.minY+b.height*i/segs;
  const jitter=(hash(seed+2700+i*29)-.5)*44;
  const inset=95+hash(seed+2800+i*31)*95;
  const rimX=waterFacingEdge+(west?-inset:inset)+jitter;
  const faceDepth=70+hash(seed+2900+i*37)*75;
  rim.push({x:rimX,y});toe.push({x:rimX+(west?faceDepth:-faceDepth),y:y+12+hash(seed+i*41)*22});
 }
 const escarpmentFace=[...rim,...toe.reverse()];
 ctx.beginPath();ctx.moveTo(escarpmentFace[0].x,escarpmentFace[0].y+scroll);for(let i=1;i<escarpmentFace.length;i++)ctx.lineTo(escarpmentFace[i].x,escarpmentFace[i].y+scroll);ctx.closePath();
 const fg=ctx.createLinearGradient(west?waterFacingEdge-220:waterFacingEdge+220,b.minY+scroll,waterFacingEdge,b.minY+scroll);
 fg.addColorStop(0,'rgba(205,195,157,.28)');fg.addColorStop(.38,'rgba(126,117,93,.62)');fg.addColorStop(1,'rgba(42,51,48,.82)');ctx.fillStyle=fg;ctx.fill();
 // escarpmentRim: a broken lit edge that distinguishes the upper plateau from the vertical face.
 ctx.strokeStyle=p.line;ctx.lineWidth=4.2;ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(rim[0].x,rim[0].y+scroll);for(let i=1;i<rim.length;i++)ctx.lineTo(rim[i].x,rim[i].y+scroll);ctx.stroke();ctx.globalAlpha=1;
 // Deep vertical joints visually tie the rim to the toe and make the face read as height, not a flat colour band.
 ctx.strokeStyle=p.crack;ctx.lineWidth=2.1;for(let i=1;i<rim.length-1;i+=2){const a=rim[i],t=toe[toe.length-1-i];ctx.beginPath();ctx.moveTo(a.x,a.y+scroll);ctx.lineTo((a.x+t.x)*.5+(hash(seed+i*53)-.5)*16,(a.y+t.y)*.5+scroll);ctx.lineTo(t.x,t.y+scroll);ctx.stroke();}
}

function drawMassifBands(ctx,zone,b,p,scroll,seed,rough){
 const limestone=(zone.kind??'').includes('limestone'),snow=(zone.kind??'').includes('snow'),harbour=(zone.kind??'').includes('harbour');
 if(harbour)return;
 const west=(b.minX+b.maxX)/2<WORLD_CENTER_X;
 const belts=limestone?5:4;
 for(let j=0;j<belts;j++){
  const edgeT=.12+j*(.68/(belts-1||1));
  const centerX=west?b.minX+b.width*(.18+edgeT*.72):b.maxX-b.width*(.18+edgeT*.72);
  const centerY=b.minY+b.height*(.12+j*.17)+(hash(seed+j*37)-.5)*b.height*.09;
  const rw=b.width*(.17+.05*hash(seed+j*41)),rh=b.height*(.12+.045*hash(seed+j*47));
  const pts=[];const n=12;
  for(let k=0;k<n;k++){const a=-Math.PI/2+Math.PI*2*k/n;const r=.72+hash(seed+j*101+k*17)*.30;pts.push({x:centerX+Math.cos(a)*rw*r,y:centerY+Math.sin(a)*rh*r});}
  const sg=ctx.createLinearGradient(centerX-rw,centerY-rh+scroll,centerX+rw,centerY+rh+scroll);sg.addColorStop(0,snow?'rgba(235,241,238,.28)':limestone?'rgba(218,202,159,.22)':'rgba(187,184,164,.18)');sg.addColorStop(.46,snow?'rgba(136,146,143,.32)':limestone?'rgba(139,125,96,.28)':'rgba(109,110,101,.25)');sg.addColorStop(1,'rgba(37,48,48,.34)');
  ctx.fillStyle=sg;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y+scroll);for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k].x,pts[k].y+scroll);ctx.closePath();ctx.fill();
  ctx.strokeStyle=p.line;ctx.globalAlpha=.56;ctx.lineWidth=2.2;ctx.stroke();ctx.globalAlpha=1;
  // Internal ledges read as stratified cliff shelves rather than detached boulders.
  for(let band=0;band<3;band++){const yy=centerY-rh*.42+band*rh*.40;ctx.strokeStyle=band===0?p.line:p.crack;ctx.globalAlpha=band===0?.45:.32;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(centerX-rw*.72,yy+scroll);ctx.bezierCurveTo(centerX-rw*.20,yy-rh*.08+scroll,centerX+rw*.25,yy+rh*.05+scroll,centerX+rw*.70,yy-rh*.02+scroll);ctx.stroke();ctx.globalAlpha=1;}
 }
}
function drawReliefForest(ctx,zone,b,scroll,seed){
 const kind=zone.kind??'',harbour=kind.includes('harbour');if(harbour)return;
 const snow=kind.includes('snow'),limestone=kind.includes('limestone');
 const area=b.width*b.height,count=Math.min(150,Math.max(limestone?32:24,Math.round(area/(limestone?7600:10500))));
 const west=(b.minX+b.maxX)/2<WORLD_CENTER_X;
 for(let i=0;i<count;i++){
  const u=hash(seed+2200+i*19),v=hash(seed+2300+i*31);
  // Bias vegetation toward upper shelves and the water-facing cliff rim while keeping interior forest pockets.
  const edgeU=hash(seed+2400+i*13)<.62?(west?.38+.62*u:.62*u):u;
  const x=b.minX+edgeU*b.width,y=b.minY+(.05+.76*v)*b.height;
  const size=(limestone?9:11)+hash(seed+2500+i*17)*(limestone?14:18);
  drawReliefPine(ctx,x,y+scroll,size,snow);
 }
}

function irregularShelf(b,seed,t,roughness){
 const count=10,pts=[];
 for(let i=0;i<=count;i++){
  const x=b.minX+b.width*i/count;
  const base=b.minY+b.height*t;
  const amp=Math.min(54,b.height*.11)*(0.35+roughness*.65);
  const y=base+(hash(seed+i*17)-.5)*amp+(Math.sin(i*.9+seed*.03))*amp*.18;
  pts.push({x,y});
 }
 return pts;
}
function drawZoneShadow(ctx,zone,scroll){
 const b=bounds(zone.points),offsetX=26+zone.height*.10,offsetY=34+zone.height*.15;
 ctx.save();ctx.globalAlpha=.26;ctx.filter='blur(9px)';ctx.translate(offsetX,offsetY);trace(ctx,zone.points,scroll);ctx.fillStyle='rgba(5,14,16,.82)';ctx.fill();ctx.restore();
}
function drawZoneFace(ctx,zone,scroll){
 const b=bounds(zone.points),p=palette(zone.kind),rough=Math.max(0,Math.min(1,zone.roughness??.6)),seed=zone.seed??1;
 ctx.save();trace(ctx,zone.points,scroll);ctx.clip();
 const g=ctx.createLinearGradient(b.minX,b.minY+scroll,b.maxX,b.maxY+scroll);g.addColorStop(0,p.top);g.addColorStop(.42,p.mid);g.addColorStop(1,p.deep);ctx.globalAlpha=RELIEF_BASE_ALPHA;ctx.fillStyle=g;ctx.fillRect(b.minX-8,b.minY+scroll-8,b.width+16,b.height+16);ctx.globalAlpha=1;
 // Broad stepped shelves replace pointed mountain primitives. Each band is irregular and overlaps the next.
 const shelfCount=Math.max(2,Math.round(zone.shelfCount??3));
 for(let s=1;s<=shelfCount;s++){
  const t=s/(shelfCount+1),line=irregularShelf(b,seed+s*101,t,rough),drop=16+zone.height*(.035+.018*s);
  ctx.beginPath();ctx.moveTo(line[0].x,line[0].y+scroll);
  for(let i=1;i<line.length;i++)ctx.lineTo(line[i].x,line[i].y+scroll);
  for(let i=line.length-1;i>=0;i--)ctx.lineTo(line[i].x,line[i].y+scroll+drop*(.75+hash(seed+s*13+i)*.5));
  ctx.closePath();ctx.fillStyle=s%2?`rgba(34,43,43,${.18+.04*rough})`:`rgba(222,216,191,${.08+.05*(1-rough)})`;ctx.fill();
  ctx.strokeStyle=p.line;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(line[0].x,line[0].y+scroll);for(let i=1;i<line.length;i++)ctx.lineTo(line[i].x,line[i].y+scroll);ctx.stroke();
 }
 // Vertical fissures and diagonal strata break repetition and establish real cliff faces.
 const cracks=Math.max(5,Math.floor(b.width/115));
 ctx.strokeStyle=p.crack;ctx.lineWidth=2.1;
 for(let i=0;i<cracks;i++){
  const x=b.minX+hash(seed+400+i*19)*b.width,y=b.minY+hash(seed+500+i*23)*b.height*.62;
  const len=34+hash(seed+600+i*29)*Math.min(150,b.height*.38);
  ctx.beginPath();ctx.moveTo(x,y+scroll);ctx.bezierCurveTo(x-12,y+len*.27+scroll,x+14,y+len*.62+scroll,x+(hash(seed+i)-.5)*28,y+len+scroll);ctx.stroke();
 }
 // Continuous water-facing escarpment establishes the main vertical cliff wall before secondary massif belts.
 drawWaterFacingEscarpment(ctx,zone,b,p,scroll,seed);
 // Continuous massif belts establish the primary mountain silhouette; smaller outcrops sit on top.
 drawMassifBands(ctx,zone,b,p,scroll,seed,rough);
 // Large fractured rock masses and ledge vegetation establish the local silhouette.
 drawRockMasses(ctx,zone,b,p,scroll,seed,rough);
 drawReliefForest(ctx,zone,b,scroll,seed);
 // Talus fields along the lower third give the massif weight at the base.
 const rocks=Math.max(8,Math.floor(b.width*b.height/26000));
 ctx.fillStyle=p.talus;
 for(let i=0;i<rocks;i++){
  const x=b.minX+hash(seed+800+i*11)*b.width,y=b.minY+b.height*(.66+hash(seed+900+i*7)*.32),r=4+hash(seed+1000+i*5)*12;
  ctx.beginPath();ctx.ellipse(x,y+scroll,r,r*(.45+hash(seed+i*3)*.3),hash(seed+i*31)*2.6,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function drawZoneRim(ctx,zone,scroll){
 const b=bounds(zone.points),p=palette(zone.kind),seed=zone.seed??1;
 ctx.save();
 // Broken upper ledges: short highlight fragments rather than one perfect outline.
 ctx.strokeStyle=p.line;ctx.lineWidth=2.2;ctx.globalAlpha=.55;
 for(let i=0;i<8;i++){
  const x=b.minX+hash(seed+1200+i*17)*b.width,y=b.minY+hash(seed+1300+i*13)*Math.min(90,b.height*.2);
  const len=28+hash(seed+1400+i*19)*68;ctx.beginPath();ctx.moveTo(x,y+scroll);ctx.lineTo(Math.min(b.maxX,x+len),y-6+hash(seed+i*7)*12+scroll);ctx.stroke();
 }
 ctx.restore();
}

/** Draw authored Level 1 terrain relief. Geometry is visual-only; gameplay collision remains in the Tiled map. */
export function drawRelief(ctx,zones,scroll=0,pass='face',time=0){
 if(!ctx||!Array.isArray(zones))return;
 for(const zone of zones){
  if(!zone?.points?.length)continue;
  if(pass==='shadow')drawZoneShadow(ctx,zone,scroll);
  else if(pass==='face')drawZoneFace(ctx,zone,scroll,time);
  else if(pass==='rim')drawZoneRim(ctx,zone,scroll);
 }
}