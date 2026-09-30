import {MODULE_ART} from './Environment.js';
import {WaterSurface} from './WaterSurface.js';
import {LEVEL1_ART} from '../content/level1Art.js';
import {drawAuthoredStructures} from './AuthoredStructures.js';
import {drawShoreEffects} from './ShoreEffects.js';
import {drawAtmosphere} from './Atmosphere.js';
import {drawRelief} from './ReliefRenderer.js';
import {drawMaterialZones,drawVegetationZones,drawTerrainShadows} from './TerrainDetailRenderer.js';

const LAND_PATTERN_ALPHA=0.46;
const CONCRETE_PATTERN_ALPHA=0.32;
const CONCRETE_BASE='#777d78';
const LAND_BASE={land:'#3f5f42','land-tropical':'#345f38','land-alpine':'#5f6358','land-snow':'#aeb8b2'};

const TEXTURE_ART={
 land:'art/environment/land-tile.png',
 'land-tropical':'art/environment/land-tropical.png',
 'land-alpine':'art/environment/land-alpine.png',
 'land-snow':'art/environment/land-snow.png',
 road:'art/environment/asphalt-tile.png',
 concrete:'art/environment/concrete-tile.png',
 dock:'art/environment/dock-metal-tile.png',
 foam:'art/environment/foam-strip.png',
 palm:'art/environment/palm.png',
 'rock-cluster':'art/environment/rock-cluster.png',
 'container-stack':'art/environment/container-stack.png',
 'street-lamp':'art/environment/street-lamp.png',
 'crate-pile':'art/environment/crate-pile.png',
 'scenic-wreck':'art/environment/scenic-wreck.png',
 'rocky-island':'art/environment/rocky-island.png',
 'helipad-mark':'art/environment/helipad-mark.png',
 'warehouse-a':'art/environment/warehouse-a.png',
 'service-building':'art/environment/service-building.png',
 'tank-small':'art/environment/tank-small.png',
 'utility-block':'art/environment/utility-block.png',
};

export class CoastalScene{
 constructor(renderer){
  this.renderer=renderer;
  this.environment=renderer.environment;
  this.map=this.environment.map;
  this.water=new WaterSurface();
  this.moduleMaterials=new Map();
  this.moduleMasks=new Map();
  this.textures=new Map();
  this.authoredAssets=new Map();
  this.chunks=new Map();
  this.chunkHeight=768;
  this.worldWidth=this.map.bounds.maxX-this.map.bounds.minX;
  this.cacheByteBudget=64*1024*1024;
  this.cacheBytes=0;
  this.visibleModules=[];
  this.visibleDockSockets=[];
  this.visibleAtmosphereZones=[];
 }
 async prepare(){
  for(const [kind,def] of Object.entries(MODULE_ART)){
   await this.renderer.preload(`module:${kind}`,def.url);
   const record=this.renderer.cache.get(`module:${kind}`);
   if(!record?.ready)throw Error(`Required environment artwork failed to load: ${def.url}`);
   this.moduleMaterials.set(kind,record.image);
   const mask=document.createElement('canvas');mask.width=record.image.width;mask.height=record.image.height;
   const c=mask.getContext('2d');c.drawImage(record.image,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#071516';c.fillRect(0,0,mask.width,mask.height);
   this.moduleMasks.set(kind,mask);
  }
  for(const [id,url] of Object.entries(TEXTURE_ART)){
   await this.renderer.preload(`terrain:${id}`,url);
   const record=this.renderer.cache.get(`terrain:${id}`);
   if(!record?.ready)throw Error(`Required terrain artwork failed to load: ${url}`);
   this.textures.set(id,record.image);
  }
  for(const [assetId,definition] of Object.entries(LEVEL1_ART)){
   await this.renderer.preload(`level1-art:${assetId}`,definition.url);
   const record=this.renderer.cache.get(`level1-art:${assetId}`);
   if(!record?.ready)throw Error(`Required Level 1 authored artwork failed to load: ${definition.url}`);
   this.authoredAssets.set(assetId,{image:record.image,definition});
  }
  const first=Math.floor(this.renderer.viewTop/this.chunkHeight)-1;
  const last=Math.floor((this.renderer.viewTop+this.renderer.viewHeight)/this.chunkHeight);
  for(let i=first;i<=last;i++)this.chunk(i);
 }
 surfaceAt(x,y,scroll){return this.environment.surfaceAtWorld(x,y-scroll);}
 draw(ctx,scroll,time,top=-260,bottom=1540){
  const start=performance.now();
  const worldTop=top-scroll,worldBottom=bottom-scroll;
  this.visibleAtmosphereZones=this.environment.visibleAtmosphere(scroll,top-240,bottom+240);
  this.visibleModules=this.environment.visibleModules(scroll,top-220,bottom+220);this.visible=this.visibleModules;
  this.visibleDockSockets=this.environment.socketsByRole('dock').filter(s=>s.y+scroll>top-120&&s.y+scroll<bottom+120);

  // The normal runtime is built from authored geography. The blueprint is review-only.
  this.water.draw(ctx,{x:this.map.bounds.minX,y:top,width:this.worldWidth,height:bottom-top,scroll,time,regions:this.map.waterRegions??[]});
  const first=Math.floor((worldTop-160)/this.chunkHeight),last=Math.floor((worldBottom+160)/this.chunkHeight);
  for(let i=first;i<=last;i++){
   const c=this.chunk(i);
   ctx.drawImage(c.structure,this.map.bounds.minX-1,c.y+scroll-1);
   ctx.drawImage(c.contact,this.map.bounds.minX-1,c.y+scroll-1);
  }
  drawAtmosphere(ctx,this.visibleAtmosphereZones,scroll,time,'shadow',this.renderer.quality??'balanced',this.map.bounds);
  drawShoreEffects(ctx,this.environment.visibleShorelines(0,top-scroll-100,bottom-scroll+100),this.map.waterRegions??[],scroll,time,this.renderer.quality??'balanced');
  this.drawContactRipples(ctx,scroll,time);

  if(this.renderer.profileLayers)ctx.getImageData(0,0,1,1);
  this.costs={waterMs:performance.now()-start,structuresMs:0,cacheBytes:this.cacheBytes};
 }
 chunk(index){
  if(this.chunks.has(index)){const c=this.chunks.get(index);this.chunks.delete(index);this.chunks.set(index,c);return c;}
  const y=index*this.chunkHeight,w=Math.ceil(this.worldWidth)+2,h=this.chunkHeight+2;
  const canvas=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const contact=canvas(),structure=canvas(),foam=contact.getContext('2d'),ctx=structure.getContext('2d');
  foam.translate(1-this.map.bounds.minX,1-y);ctx.translate(1-this.map.bounds.minX,1-y);
  this.drawShoreContact(foam,y,y+this.chunkHeight);
  this.drawMasterTerrain(ctx,y,y+this.chunkHeight);
  const bytes=w*h*4*2,c={y,contact,structure,bytes};this.chunks.set(index,c);this.cacheBytes+=bytes;
  while(this.cacheBytes>this.cacheByteBudget&&this.chunks.size>2){const key=this.chunks.keys().next().value,old=this.chunks.get(key);if(key===index){this.chunks.delete(key);this.chunks.set(key,old);continue;}this.cacheBytes-=old.bytes;old.contact.width=old.structure.width=1;this.chunks.delete(key);}
  return c;
 }
 appendScreenPolygon(ctx,feature,scroll){
  const pts=feature?.points;if(!pts?.length)return;
  ctx.moveTo(pts[0].x,pts[0].y+scroll);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y+scroll);
  ctx.closePath();
 }
 clipWaterOverlay(ctx,scroll,top,bottom,time){
  const worldMin=top-scroll-120,worldMax=bottom-scroll+120;
  const blockers=[
   ...this.environment.visibleLand(0,worldMin,worldMax),
   ...this.environment.visibleConcrete(0,worldMin,worldMax),
   ...this.environment.visibleMaritimeStructures(0,worldMin,worldMax),
   ...this.environment.visibleDocks(0,worldMin,worldMax),
  ];
  const reopen=this.environment.visibleWaterCutouts(0,worldMin,worldMax);
  ctx.save();ctx.beginPath();ctx.rect(this.map.bounds.minX,top,this.worldWidth,bottom-top);
  for(const feature of blockers)this.appendScreenPolygon(ctx,feature,scroll);
  for(const feature of reopen)this.appendScreenPolygon(ctx,feature,scroll);
  try{ctx.clip('evenodd');}catch{ctx.clip();}
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=.20;
  this.water.draw(ctx,{x:this.map.bounds.minX,y:top,width:this.worldWidth,height:bottom-top,scroll,time,regions:this.map.waterRegions??[]});
  ctx.restore();
 }
 drawAnimatedShoreFoam(ctx,scroll,time,top,bottom){
  const shorelines=this.environment.visibleShorelines(0,top-scroll-100,bottom-scroll+100);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([18,13]);
  for(let i=0;i<shorelines.length;i++){
   const line=shorelines[i],pts=line.points;if(!pts?.length)continue;
   ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y+scroll);
   for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y+scroll);
   ctx.lineDashOffset=-(time*25+i*11)%31;
   ctx.strokeStyle='rgba(229,251,246,.58)';ctx.lineWidth=5;ctx.stroke();
   ctx.lineDashOffset=-(time*13+i*7)%37;ctx.strokeStyle='rgba(137,226,217,.32)';ctx.lineWidth=11;ctx.stroke();
  }
  ctx.setLineDash([]);ctx.restore();
 }
 pattern(ctx,id){const img=this.textures.get(id);return img?ctx.createPattern(img,'repeat'):null;}
 tracePolygon(ctx,points){ctx.beginPath();if(!points?.length)return;ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();}
 tracePolyline(ctx,points){ctx.beginPath();if(!points?.length)return;ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);}
 drawPolygon(ctx,feature,material,alpha=1){
  const pattern=this.pattern(ctx,material);if(!pattern)return;
  const land=material==='land'||material==='land-tropical'||material==='land-alpine'||material==='land-snow';
  const concreteLike=material==='concrete'||material==='dock';
  ctx.save();this.tracePolygon(ctx,feature.points);ctx.clip();
  const b=this.bounds(feature.points);
  if(land){ctx.globalAlpha=alpha;ctx.fillStyle=LAND_BASE[material]??LAND_BASE.land;ctx.fillRect(b.minX-64,b.minY-64,b.maxX-b.minX+128,b.maxY-b.minY+128);ctx.globalAlpha=alpha*LAND_PATTERN_ALPHA;ctx.fillStyle=pattern;ctx.fillRect(b.minX-64,b.minY-64,b.maxX-b.minX+128,b.maxY-b.minY+128);ctx.globalAlpha=1;this.drawLandMacroVariation(ctx,feature,b,material);}else if(concreteLike){ctx.globalAlpha=alpha;ctx.fillStyle=material==='dock'?'#616b69':CONCRETE_BASE;ctx.fillRect(b.minX-64,b.minY-64,b.maxX-b.minX+128,b.maxY-b.minY+128);ctx.globalAlpha=alpha*CONCRETE_PATTERN_ALPHA;ctx.fillStyle=pattern;ctx.fillRect(b.minX-64,b.minY-64,b.maxX-b.minX+128,b.maxY-b.minY+128);ctx.globalAlpha=1;}else{ctx.globalAlpha=alpha;ctx.fillStyle=pattern;ctx.fillRect(b.minX-64,b.minY-64,b.maxX-b.minX+128,b.maxY-b.minY+128);}
  ctx.restore();
 }
 drawLandMacroVariation(ctx,feature,b,material){
  const seed=[...String(feature.id??material)].reduce((n,c)=>n+c.charCodeAt(0),37),snow=material==='land-snow',alpine=material==='land-alpine'||snow;
  const broad=ctx.createLinearGradient(b.minX,b.minY,b.maxX,b.maxY);broad.addColorStop(0,snow?'rgba(247,250,248,.16)':alpine?'rgba(202,197,176,.10)':'rgba(194,177,118,.10)');broad.addColorStop(.48,'rgba(0,0,0,0)');broad.addColorStop(1,snow?'rgba(55,68,70,.18)':'rgba(14,35,23,.18)');ctx.fillStyle=broad;ctx.fillRect(b.minX-16,b.minY-16,b.maxX-b.minX+32,b.maxY-b.minY+32);
  const blobs=Math.max(5,Math.min(16,Math.round((b.maxX-b.minX)*(b.maxY-b.minY)/120000)));
  for(let i=0;i<blobs;i++){const x=b.minX+this.detailHash(seed+i*31)*(b.maxX-b.minX),y=b.minY+this.detailHash(seed+i*47+7)*(b.maxY-b.minY),rx=90+this.detailHash(seed+i*19)*210,ry=45+this.detailHash(seed+i*23)*120;const g=ctx.createRadialGradient(x,y,0,x,y,rx);const dark=this.detailHash(seed+i*13)>.48;g.addColorStop(0,dark?(snow?'rgba(46,59,61,.16)':'rgba(12,36,22,.18)'):(snow?'rgba(245,249,247,.14)':'rgba(206,186,122,.12)'));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rx,ry,this.detailHash(seed+i*29)*1.8,0,Math.PI*2);ctx.fill();}
 }
 drawRoad(ctx,road){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  this.tracePolyline(ctx,road.points);ctx.strokeStyle='rgba(11,15,16,.64)';ctx.lineWidth=road.width+18;ctx.stroke();
  this.tracePolyline(ctx,road.points);ctx.strokeStyle=this.pattern(ctx,'road')??'#343a3b';ctx.lineWidth=road.width;ctx.stroke();
  this.tracePolyline(ctx,road.points);ctx.strokeStyle='rgba(240,213,151,.38)';ctx.lineWidth=2.2;ctx.setLineDash([24,24]);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
 }
 bounds(points){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of points){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}return{minX,minY,maxX,maxY};}
 cutWater(ctx,feature){ctx.save();ctx.globalCompositeOperation='destination-out';this.tracePolygon(ctx,feature.points);ctx.fillStyle='#000';ctx.fill();ctx.restore();}
 drawMasterTerrain(ctx,minY,maxY){
  const lands=this.environment.visibleLand(0,minY,maxY);
  const concrete=this.environment.visibleConcrete(0,minY,maxY);
  const waterCutouts=this.environment.visibleWaterCutouts(0,minY,maxY);
  const maritime=this.environment.visibleMaritimeStructures(0,minY,maxY);
  const docks=this.environment.visibleDocks(0,minY,maxY);
  const roads=this.environment.visibleRoads(0,minY,maxY);
  const modules=this.environment.visibleModules(0,minY-220,maxY+220);
  const decorations=this.environment.visibleDecorations(0,minY-160,maxY+160);

  // A single continuous master map is drawn into cache strips. Chunks are only a render cache.
  for(const land of lands){ctx.save();ctx.translate(15,21);ctx.globalAlpha=.34;this.tracePolygon(ctx,land.points);ctx.fillStyle='#071313';ctx.fill();ctx.restore();this.drawPolygon(ctx,land,land.material??'land',1);}
  const terrainShadows=this.environment.visibleShadowCasters(0,minY-260,maxY+260);
  drawTerrainShadows(ctx,terrainShadows,0);
  this.drawCoastalCliffRelief(ctx,minY,maxY);
  this.drawProjectedCliffFaces(ctx,minY,maxY);
  const reliefZones=this.environment.visibleReliefZones(0,minY-220,maxY+220);
  drawRelief(ctx,reliefZones,0,'shadow',0);
  drawRelief(ctx,reliefZones,0,'face',0);
  drawRelief(ctx,reliefZones,0,'rim',0);
  this.drawTerrainMicroDetail(ctx,lands);
  const materialZones=this.environment.visibleMaterialZones(0,minY-180,maxY+180);
  drawMaterialZones(ctx,materialZones,0);
  const vegetationZones=this.environment.visibleVegetationZones(0,minY-180,maxY+180);
  drawVegetationZones(ctx,vegetationZones,0);
  for(const zone of concrete){ctx.save();ctx.translate(7,10);ctx.globalAlpha=.32;this.tracePolygon(ctx,zone.points);ctx.fillStyle='#061011';ctx.fill();ctx.restore();this.drawPolygon(ctx,zone,'concrete',1);}
  // Carved coves/dry docks reveal the animated water underneath instead of painting fake water into terrain.
  for(const cutout of waterCutouts)this.cutWater(ctx,cutout);
  for(const structure of maritime){ctx.save();ctx.translate(6,9);ctx.globalAlpha=.36;this.tracePolygon(ctx,structure.points);ctx.fillStyle='#061011';ctx.fill();ctx.restore();this.drawPolygon(ctx,structure,'concrete',1);}
  for(const dock of docks){ctx.save();ctx.translate(9,12);ctx.globalAlpha=.38;this.tracePolygon(ctx,dock.points);ctx.fillStyle='#061011';ctx.fill();ctx.restore();this.drawPolygon(ctx,dock,'dock',1);}
  const terrainArt=this.environment.visibleArtInstances(0,minY-320,maxY+320).filter(i=>i.renderLayer==='terrain');
  drawAuthoredStructures(ctx,terrainArt,this.authoredAssets,'shadow',0);
  drawAuthoredStructures(ctx,terrainArt,this.authoredAssets,'terrain',0);

  this.drawMountainRoadDepth(ctx,roads);
  for(const road of roads)this.drawRoad(ctx,road);

  const authored=this.environment.visibleArtInstances(0,minY-320,maxY+320).filter(i=>i.renderLayer==='ground');
  drawAuthoredStructures(ctx,authored,this.authoredAssets,'shadow',0);
  drawAuthoredStructures(ctx,authored,this.authoredAssets,'ground',0);

  for(const m of modules)if(m.kind!=='bridge')this.drawModuleShadow(ctx,m);
  for(const m of modules)if(m.kind!=='bridge')this.drawModule(ctx,m,0);
  for(const d of decorations)this.drawDecoration(ctx,d);
 }


 drawCoastalCliffRelief(ctx,minY,maxY){
  const shorelines=this.environment.visibleShorelines(0,minY-120,maxY+120);
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  for(const shoreline of shorelines){
   const pts=shoreline.points??[];if(pts.length<2||shoreline.contactKind==='quay'||shoreline.contactKind==='beach')continue;
   for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],my=(a.y+b.y)/2,district=this.environment.districtAtWorldY(my);
    if(!['coastal-narrows','bridge-gateway'].includes(district?.id))continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;if(len<8)continue;
    const nx=-dy/len,ny=dx/len,waterSign=shoreline.waterSide==='right'?1:-1,landSign=-waterSign;
    const gatewayCliffDepth=Math.max(180,170+Math.min(120,Math.max(0,Number(shoreline.height??45))*1.65));
    const depth=gatewayCliffDepth;
    const ax=a.x+nx*landSign*depth,ay=a.y+ny*landSign*depth,bx=b.x+nx*landSign*depth,by=b.y+ny*landSign*depth;
    const g=ctx.createLinearGradient(a.x,a.y,ax,ay);g.addColorStop(0,'rgba(181,169,139,.98)');g.addColorStop(.42,'rgba(132,122,98,.97)');g.addColorStop(1,'rgba(74,77,65,.92)');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(bx,by);ctx.lineTo(ax,ay);ctx.closePath();ctx.fill();
    // Fractured limestone ledges and vertical seams reproduce the gateway's tall rock shelves.
    ctx.strokeStyle='rgba(225,214,181,.35)';ctx.lineWidth=2.2;for(const t of [.22,.48,.72]){ctx.beginPath();ctx.moveTo(a.x+(ax-a.x)*t,a.y+(ay-a.y)*t);ctx.lineTo(b.x+(bx-b.x)*t,b.y+(by-b.y)*t);ctx.stroke();}
    const cracks=Math.max(1,Math.floor(len/72));ctx.strokeStyle='rgba(38,47,42,.36)';ctx.lineWidth=2.4;
    for(let k=1;k<=cracks;k++){const t=k/(cracks+1),sx=a.x+dx*t,sy=a.y+dy*t;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+nx*landSign*depth*(.58+.2*(k%2)),sy+ny*landSign*depth*(.58+.2*(k%2)));ctx.stroke();}
    const rockColumnCount=Math.max(2,Math.floor(len/58));
    for(let k=0;k<rockColumnCount;k++){
     const t0=k/rockColumnCount,t1=(k+1)/rockColumnCount;
     const sx0=a.x+dx*t0,sy0=a.y+dy*t0,sx1=a.x+dx*t1,sy1=a.y+dy*t1;
     const d0=depth*(.72+.18*this.detailHash(my+k*31)),d1=depth*(.68+.22*this.detailHash(my+k*37+9));
     const lx0=sx0+nx*landSign*d0,ly0=sy0+ny*landSign*d0,lx1=sx1+nx*landSign*d1,ly1=sy1+ny*landSign*d1;
     ctx.fillStyle=k%3===0?'rgba(211,198,158,.18)':k%3===1?'rgba(56,65,59,.16)':'rgba(151,140,110,.16)';
     ctx.beginPath();ctx.moveTo(sx0,sy0);ctx.lineTo(sx1,sy1);ctx.lineTo(lx1,ly1);ctx.lineTo(lx0,ly0);ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle='rgba(24,35,34,.46)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    // Broken upper rim with shrubs/pines keeps rock and foliage interlocked rather than forming a clean stripe.
    const rimX=(ax+bx)/2,rimY=(ay+by)/2;if(len>55){for(let k=0;k<Math.min(4,Math.floor(len/75));k++){const t=(k+1)/(Math.min(4,Math.floor(len/75))+1),x=ax+(bx-ax)*t,y=ay+(by-ay)*t,size=9+this.detailHash(my+k*23)*12;this.drawPine(ctx,x,y,size,false);}}
   }
  }
  ctx.restore();
 }

 drawProjectedCliffFaces(ctx,minY,maxY){
  const shorelines=this.environment.visibleShorelines(0,minY-140,maxY+140);
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  for(const shoreline of shorelines){
   const pts=shoreline.points??[];if(pts.length<2)continue;
   for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    if(len<3)continue;
    const midY=(a.y+b.y)/2,district=this.environment.districtAtWorldY(midY);
    const snow=district?.biome==='snow',alpine=district?.biome==='alpine'||snow;
    const nx=-dy/len,ny=dx/len,sign=shoreline.waterSide==='right'?1:-1;
    const authoredHeight=Math.max(0,Number(shoreline.height??0));
    const faceDepth=Math.max(shoreline.contactKind==='beach'?10:16,Math.min(70,authoredHeight*.72+18));
    const sx=nx*sign*faceDepth,sy=ny*sign*faceDepth+Math.min(22,faceDepth*.28);
    const footA={x:a.x+sx,y:a.y+sy},footB={x:b.x+sx,y:b.y+sy};
    const g=ctx.createLinearGradient((a.x+b.x)/2,(a.y+b.y)/2,(footA.x+footB.x)/2,(footA.y+footB.y)/2);
    if(snow){g.addColorStop(0,'rgba(222,226,219,.98)');g.addColorStop(.28,'rgba(156,160,157,.98)');g.addColorStop(1,'rgba(49,57,61,.98)');}
    else if(alpine){g.addColorStop(0,'rgba(157,157,145,.96)');g.addColorStop(.35,'rgba(104,104,95,.98)');g.addColorStop(1,'rgba(43,49,48,.98)');}
    else {g.addColorStop(0,'rgba(177,163,132,.96)');g.addColorStop(.30,'rgba(112,104,84,.98)');g.addColorStop(1,'rgba(47,53,46,.98)');}
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(footB.x,footB.y);ctx.lineTo(footA.x,footA.y);ctx.closePath();ctx.fillStyle=g;ctx.fill();
    // Rock strata make the vertical face legible without the old thick-outline shortcut.
    if(len>34&&shoreline.contactKind!=='quay'){
     ctx.strokeStyle=snow?'rgba(247,250,246,.34)':'rgba(220,207,173,.25)';ctx.lineWidth=1.6;
     for(const t of [.28,.58,.82]){
      const ax=a.x+sx*t,ay=a.y+sy*t,bx=b.x+sx*t,by=b.y+sy*t;
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
     }
     ctx.strokeStyle='rgba(17,27,26,.26)';ctx.lineWidth=2;
     const fissures=Math.max(1,Math.floor(len/115));
     for(let k=1;k<=fissures;k++){
      const t=k/(fissures+1),rx=a.x+dx*t,ry=a.y+dy*t;
      ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx+sx*.72+(k%2?5:-4),ry+sy*.72);ctx.stroke();
     }
    }
   }
   // Crisp upper rim catches the common upper-left key light.
   this.tracePolyline(ctx,pts);ctx.strokeStyle=shoreline.contactKind==='ice'?'rgba(242,249,250,.76)':'rgba(213,205,178,.48)';ctx.lineWidth=4;ctx.stroke();
  }
  ctx.restore();
 }

 detailHash(n){return ((Math.sin(n*12.9898+78.233)*43758.5453123)%1+1)%1;}
 pointInPolygon(point,points){
  let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j],hit=((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/((b.y-a.y)||1e-9)+a.x);if(hit)inside=!inside;
  }return inside;
 }
 drawPine(ctx,x,y,size,snow=false){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(7,18,15,.34)';ctx.beginPath();ctx.ellipse(size*.18,size*.26,size*.44,size*.18,-.45,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=snow?'#294238':'#173d29';ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(-size*.46,size*.34);ctx.lineTo(size*.46,size*.34);ctx.closePath();ctx.fill();
  ctx.fillStyle=snow?'#3f5b49':'#26583a';ctx.beginPath();ctx.moveTo(-size*.04,-size*.78);ctx.lineTo(-size*.34,size*.08);ctx.lineTo(size*.26,size*.08);ctx.closePath();ctx.fill();
  if(snow){ctx.strokeStyle='rgba(239,247,245,.78)';ctx.lineWidth=Math.max(1.2,size*.09);ctx.beginPath();ctx.moveTo(-size*.05,-size*.72);ctx.lineTo(-size*.28,-size*.05);ctx.moveTo(-size*.02,-size*.38);ctx.lineTo(size*.24,size*.08);ctx.stroke();}
  ctx.restore();
 }
 drawTerrainMicroDetail(ctx,lands){
  for(const land of lands){
   const pts=land.points??[];if(pts.length<3)continue;
   const b=this.bounds(pts),w=b.maxX-b.minX,h=b.maxY-b.minY;if(w<35||h<35)continue;
   const centerY=(b.minY+b.maxY)/2,district=this.environment.districtAtWorldY(centerY),biome=district?.biome??'temperate-coast';
   const snow=biome==='snow',alpine=biome==='alpine'||snow,tropical=!alpine;
   const seed=[...String(land.id??'land')].reduce((v,c)=>v+c.charCodeAt(0),17);
   const attempts=Math.min(84,Math.max(10,Math.round((w*h)/21000)));
   ctx.save();this.tracePolygon(ctx,pts);ctx.clip();
   for(let i=0;i<attempts;i++){
    const x=b.minX+this.detailHash(seed+i*17)*w,y=b.minY+this.detailHash(seed+i*29+7)*h;
    if(!this.pointInPolygon({x,y},pts))continue;
    const r=this.detailHash(seed+i*43+11);
    if(alpine&&r<.68){this.drawPine(ctx,x,y,10+this.detailHash(seed+i*31)*16,snow);continue;}
    if(tropical&&r<.58){
     const size=8+this.detailHash(seed+i*37)*17;ctx.fillStyle='rgba(8,24,15,.28)';ctx.beginPath();ctx.ellipse(x+5,y+7,size*.9,size*.45,.25,0,Math.PI*2);ctx.fill();
     ctx.fillStyle=r<.25?'#1d5b33':'#2e6838';ctx.beginPath();ctx.ellipse(x,y,size,size*.72,this.detailHash(seed+i)*Math.PI,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='rgba(102,139,64,.55)';ctx.beginPath();ctx.ellipse(x-size*.2,y-size*.2,size*.45,size*.28,0,0,Math.PI*2);ctx.fill();continue;
    }
    const rock=5+this.detailHash(seed+i*19)*10;ctx.fillStyle=snow?'rgba(79,84,82,.58)':'rgba(101,94,77,.54)';ctx.beginPath();ctx.ellipse(x,y,rock,rock*.58,this.detailHash(seed+i*9)*2.5,0,Math.PI*2);ctx.fill();
    if(snow){ctx.fillStyle='rgba(242,247,246,.62)';ctx.beginPath();ctx.ellipse(x-2,y-rock*.32,rock*.72,rock*.24,0,0,Math.PI*2);ctx.fill();}
   }
   // Material-scale veining keeps quiet frames detailed without creating bullet-like high contrast.
   ctx.globalAlpha=snow?.18:.12;ctx.strokeStyle=snow?'#eef5f4':'#d7cfa8';ctx.lineWidth=1.2;
   for(let i=0;i<Math.min(14,Math.max(3,Math.floor(w/150)));i++){
    const x=b.minX+this.detailHash(seed+300+i*13)*w,y=b.minY+this.detailHash(seed+400+i*23)*h;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18+this.detailHash(seed+i)*42,y-8+this.detailHash(seed+i*5)*22);ctx.stroke();
   }
   ctx.restore();
  }
 }


 drawMountainRoadDepth(ctx,roads){
  const mid=(this.map.bounds.minX+this.map.bounds.maxX)/2;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const road of roads){const pts=road.points??[];for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,d=this.environment.districtAtWorldY(my);if(d?.biome!=='alpine'&&d?.biome!=='snow')continue;
   const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,toCenter=mid-mx,sign=(nx*toCenter)>=0?1:-1,off=14;
   const ax=a.x+nx*off*sign,ay=a.y+ny*off*sign,bx=b.x+nx*off*sign,by=b.y+ny*off*sign;
   ctx.strokeStyle='rgba(24,31,31,.72)';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(ax,ay+8);ctx.lineTo(bx,by+8);ctx.stroke();
   ctx.strokeStyle=d.biome==='snow'?'rgba(184,188,179,.88)':'rgba(126,119,101,.90)';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
   ctx.strokeStyle='rgba(226,225,207,.42)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,ay-3);ctx.lineTo(bx,by-3);ctx.stroke();
   if(len>110){const steps=Math.floor(len/70);ctx.fillStyle='rgba(221,219,198,.68)';for(let k=1;k<steps;k++){const t=k/steps,px=ax+(bx-ax)*t,py=ay+(by-ay)*t;ctx.fillRect(px-2,py-9,4,13);}}
  }}ctx.restore();
 }


  drawShoreContact(ctx,minY,maxY){
  const shorelines=this.environment.visibleShorelines(0,minY-100,maxY+100);
  const foamPattern=this.pattern(ctx,'foam');
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const shoreline of shorelines){
   this.tracePolyline(ctx,shoreline.points);ctx.strokeStyle='rgba(2,20,23,.36)';ctx.lineWidth=34;ctx.stroke();
   this.tracePolyline(ctx,shoreline.points);ctx.strokeStyle='rgba(115,205,195,.30)';ctx.lineWidth=18;ctx.stroke();
   this.tracePolyline(ctx,shoreline.points);ctx.strokeStyle=foamPattern??'rgba(220,247,237,.72)';ctx.globalAlpha=.66;ctx.lineWidth=8;ctx.stroke();ctx.globalAlpha=1;
  }
  ctx.restore();
 }
 drawDecoration(ctx,d){
  const img=this.textures.get(d.asset);if(!img)return;
  ctx.save();const cx=d.x+d.width/2,cy=d.y+d.height/2;ctx.translate(cx,cy);if(d.rotation)ctx.rotate(d.rotation);ctx.globalAlpha=d.alpha??1;
  ctx.drawImage(img,-d.width/2,-d.height/2,d.width,d.height);ctx.restore();
 }
 drawModuleShadow(ctx,m){
  const mask=this.moduleMasks.get(m.kind);if(!mask)return;
  ctx.save();const cx=m.x+m.width/2,cy=m.y+m.height/2;ctx.translate(cx+m.elevation*.50,cy+m.elevation*.70);if(m.rotation)ctx.rotate(m.rotation);ctx.globalAlpha=m.kind==='bridge'?.48:.32;
  ctx.drawImage(mask,-m.width/2,-m.height/2,m.width,m.height);ctx.restore();
 }
 drawModule(ctx,m,scroll){
  const img=this.moduleMaterials.get(m.kind);if(!img)return;
  ctx.save();const cx=m.x+m.width/2,cy=m.y+scroll+m.height/2;ctx.translate(cx,cy);if(m.rotation)ctx.rotate(m.rotation);ctx.drawImage(img,-m.width/2,-m.height/2,m.width,m.height);ctx.restore();
 }
 drawElevated(ctx,scroll,time){
  const elevated=this.environment.visibleArtInstances(scroll,-360,1640).filter(i=>i.renderLayer==='elevated');
  drawAuthoredStructures(ctx,elevated,this.authoredAssets,'shadow',scroll);
  for(const bridge of this.environment.visibleBridges(scroll,-260,1540)){this.drawBridgeShadow(ctx,bridge,scroll);this.drawBridge(ctx,bridge,scroll);}
  this.drawCurvedDamArchitecture(ctx,scroll,time);
  this.drawCitadelBasinDetails(ctx,scroll,time);
  drawAuthoredStructures(ctx,elevated,this.authoredAssets,'elevated',scroll);
  this.drawDamSpray(ctx,scroll,time);
  this.drawCanyonWaterfalls(ctx,scroll,time);
  drawAtmosphere(ctx,this.visibleAtmosphereZones,scroll,time,'low',this.renderer.quality??'balanced',this.map.bounds);
  this.drawNavigationLights(ctx,scroll,time);
  drawAtmosphere(ctx,this.visibleAtmosphereZones,scroll,time,'high',this.renderer.quality??'balanced',this.map.bounds);
 }

 drawBridgeShadow(ctx,b,scroll){
  const deckY=b.y+scroll+b.height/2,w=b.width;
  ctx.save();ctx.translate(20,b.elevation*.40);ctx.globalAlpha=.32;ctx.fillStyle='#071113';ctx.fillRect(b.x,deckY-21,w,42);
  if(b.id==='narrows-bridge')for(const tx of [b.x+w*.16,b.x+w*.84]){ctx.beginPath();ctx.ellipse(tx,deckY+15,70,115,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 drawBridgeUnderstructure(ctx,x,deckY,w,fortified=true){
  const left=x+w*(fortified?.16:.25),right=x+w*(fortified?.84:.75),span=right-left;
  ctx.save();
  ctx.fillStyle='#273435';ctx.fillRect(left,deckY+13,span,16);
  if(fortified){
   // One broad shallow arch and restrained steel ribs match the reference bridge better than a zigzag truss.
   ctx.strokeStyle='#435453';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(left,deckY+31);ctx.quadraticCurveTo((left+right)/2,deckY+104,right,deckY+31);ctx.stroke();
   ctx.strokeStyle='rgba(186,194,184,.48)';ctx.lineWidth=3;for(let i=1;i<6;i++){const t=i/6,px=left+span*t,archY=deckY+31+73*(1-Math.pow((t-.5)*2,2));ctx.beginPath();ctx.moveTo(px,deckY+29);ctx.lineTo(px,archY);ctx.stroke();}
  }else{
   ctx.strokeStyle='#3e5152';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(left,deckY+27);ctx.lineTo((left+right)/2,deckY+68);ctx.lineTo(right,deckY+27);ctx.stroke();
  }
  for(const px of fortified?[left+span*.30,left+span*.70]:[left,right]){ctx.fillStyle='#626965';ctx.beginPath();ctx.moveTo(px-18,deckY+22);ctx.lineTo(px+18,deckY+22);ctx.lineTo(px+29,deckY+116);ctx.lineTo(px-29,deckY+116);ctx.closePath();ctx.fill();ctx.fillStyle='#303a3b';ctx.fillRect(px-33,deckY+107,66,18);ctx.strokeStyle='rgba(225,225,211,.34)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px-10,deckY+31);ctx.lineTo(px-16,deckY+101);ctx.stroke();}
  ctx.restore();
 }
 drawFortifiedDeck(ctx,x,deckY,w){
  ctx.fillStyle='#303636';ctx.fillRect(x,deckY-22,w,44);ctx.fillStyle='#777a74';ctx.fillRect(x,deckY-15,w,28);ctx.fillStyle='#4b514f';ctx.fillRect(x,deckY+12,w,10);
  ctx.fillStyle='#b9b6a8';ctx.fillRect(x,deckY-22,w,5);ctx.fillRect(x,deckY+17,w,5);
  ctx.strokeStyle='rgba(239,225,185,.72)';ctx.lineWidth=2;ctx.setLineDash([36,28]);ctx.beginPath();ctx.moveTo(x+28,deckY);ctx.lineTo(x+w-28,deckY);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<10;i++){const px=x+20+i*(w-40)/9;ctx.fillStyle='rgba(224,216,190,.72)';ctx.fillRect(px-2,deckY-27,4,9);ctx.fillRect(px-2,deckY+18,4,9);}
 }
 drawFortifiedGatewayTower(ctx,tx,deckY,scale=1,side=1){
  const w=82*scale,h=142*scale;
  ctx.save();
  // Massive bank footing integrated into the cliff, matching the blueprint's fortified gateway character.
  ctx.fillStyle='#303a3a';ctx.beginPath();ctx.moveTo(tx-w*.72,deckY+20);ctx.lineTo(tx+w*.72,deckY+20);ctx.lineTo(tx+w*.92,deckY+92*scale);ctx.lineTo(tx-w*.92,deckY+92*scale);ctx.closePath();ctx.fill();
  const g=ctx.createLinearGradient(tx-w/2,deckY-h,tx+w/2,deckY+15);g.addColorStop(0,'#c7c4b7');g.addColorStop(.36,'#97968b');g.addColorStop(1,'#545b57');
  ctx.fillStyle=g;ctx.strokeStyle='#3d4745';ctx.lineWidth=7*scale;ctx.beginPath();ctx.moveTo(tx-w*.50,deckY+22);ctx.lineTo(tx-w*.50,deckY-h*.70);ctx.lineTo(tx-w*.34,deckY-h);ctx.lineTo(tx+w*.34,deckY-h);ctx.lineTo(tx+w*.50,deckY-h*.70);ctx.lineTo(tx+w*.50,deckY+22);ctx.closePath();ctx.fill();ctx.stroke();
  // Battlements / observation cap.
  ctx.fillStyle='#d2cec0';ctx.fillRect(tx-w*.48,deckY-h-9*scale,w*.96,18*scale);
  for(let i=-2;i<=2;i++){ctx.fillStyle='#5b625e';ctx.fillRect(tx+i*w*.18-5*scale,deckY-h-14*scale,10*scale,14*scale);}
  // Warm signal light and narrow windows give local scale cues.
  ctx.fillStyle='#263538';ctx.fillRect(tx-w*.22,deckY-h*.62,w*.44,18*scale);ctx.fillRect(tx-w*.18,deckY-h*.36,w*.36,25*scale);
  const lx=tx+side*w*.36,ly=deckY-h*.86;const glow=ctx.createRadialGradient(lx,ly,0,lx,ly,18*scale);glow.addColorStop(0,'rgba(255,222,151,.95)');glow.addColorStop(.28,'rgba(255,166,75,.55)');glow.addColorStop(1,'rgba(255,130,50,0)');ctx.fillStyle=glow;ctx.fillRect(lx-18*scale,ly-18*scale,36*scale,36*scale);
  ctx.restore();
 }
 drawBridge(ctx,b,scroll){
  const x=b.x,y=b.y+scroll,w=b.width,deckY=y+b.height/2,fortified=b.id==='narrows-bridge';
  ctx.save();
  this.drawBridgeUnderstructure(ctx,x,deckY,w,fortified);
  this.drawFortifiedDeck(ctx,x,deckY,w);
  if(fortified){
   // The monumental gateway towers/terraces are authored instances registered to the banks.
   // Keep only compact deck gateposts here so the bridge structure does not duplicate the hero art.
   for(const tx of [x+w*.16,x+w*.84]){ctx.fillStyle='#696d64';ctx.fillRect(tx-18,deckY-39,36,62);ctx.fillStyle='#d1c9ae';ctx.fillRect(tx-20,deckY-45,40,10);}
  }else{
   this.drawFortifiedGatewayTower(ctx,x+w*.25,deckY,.55,-1);this.drawFortifiedGatewayTower(ctx,x+w*.75,deckY,.55,1);
  }
  ctx.restore();
 }

 drawCurvedDamArchitecture(ctx,scroll,time){
  const art=(this.map.artInstances??[]).find(i=>i.id==='dam-face-main');if(!art)return;const y=art.y+scroll;
  if(y<-760||y>1660)return;const b=art.visualBounds,cx=(b.minX+b.maxX)/2,w=b.maxX-b.minX;
  ctx.save();
  // Massive cliff-bound abutments behind the sprite make the dam belong to the canyon.
  for(const side of [-1,1]){const x=cx+side*w*.53;ctx.fillStyle='rgba(32,39,39,.82)';ctx.beginPath();ctx.moveTo(x-side*36,y-170);ctx.lineTo(x+side*155,y-110);ctx.lineTo(x+side*180,y+225);ctx.lineTo(x-side*28,y+180);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(186,180,157,.30)';ctx.lineWidth=6;ctx.stroke();}
  // Curved crown and reservoir lip: visual curvature is deliberately stronger than the old flat slab.
  ctx.strokeStyle='rgba(25,36,38,.72)';ctx.lineWidth=36;ctx.beginPath();ctx.moveTo(cx-w*.48,y-202);ctx.quadraticCurveTo(cx,y-260,cx+w*.48,y-202);ctx.stroke();
  ctx.strokeStyle='rgba(225,226,216,.92)';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(cx-w*.48,y-211);ctx.quadraticCurveTo(cx,y-268,cx+w*.48,y-211);ctx.stroke();
  ctx.strokeStyle='rgba(241,246,243,.50)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx-w*.46,y-219);ctx.quadraticCurveTo(cx,y-268,cx+w*.46,y-219);ctx.stroke();
  // Warm service lights define scale along the crown.
  for(let i=-4;i<=4;i++){const t=i/4.6,x=cx+t*w*.39,yy=y-246+Math.abs(t)*37;const g=ctx.createRadialGradient(x,yy,0,x,yy,18);g.addColorStop(0,'rgba(255,210,130,.75)');g.addColorStop(1,'rgba(255,145,60,0)');ctx.fillStyle=g;ctx.fillRect(x-18,yy-18,36,36);}
  ctx.restore();
 }
 drawCitadelBasinDetails(ctx,scroll,time){
  const gate=(this.map.artInstances??[]).find(i=>i.id==='citadel-gate-main');if(!gate)return;const gy=gate.y+scroll;if(gy<-900||gy>1750)return;
  const cx=gate.x,sx=this.worldWidth/2605.7861328125,w=1500*sx;
  ctx.save();
  // Rear ramparts are registered to the runtime portrait projection so they stay attached to the mountain walls.
  const rearY=gy-305;ctx.fillStyle='rgba(58,67,68,.92)';ctx.strokeStyle='rgba(30,41,43,.92)';ctx.lineWidth=8;
  for(const side of [-1,1]){const x0=cx+side*360*sx,x1=cx+side*760*sx;ctx.beginPath();ctx.moveTo(x0,rearY+70);ctx.lineTo(x1,rearY+132);ctx.lineTo(x1,rearY+280);ctx.lineTo(x0,rearY+215);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='rgba(229,235,231,.62)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x0,rearY+64);ctx.lineTo(x1,rearY+126);ctx.stroke();ctx.strokeStyle='rgba(30,41,43,.92)';ctx.lineWidth=8;
   const span=Math.abs(x1-x0),steps=Math.max(4,Math.floor(span/72));for(let i=0;i<=steps;i++){const t=i/steps,x=x0+(x1-x0)*t,y=rearY+70+(132-70)*t;ctx.fillStyle='#737d7a';ctx.fillRect(x-8*sx,y-18,16*sx,24);}
  }
  // Side defence terraces, lamps and dark embrasures add the dense layered silhouette of the blueprint.
  for(const side of [-1,1])for(let row=0;row<3;row++){const baseX=cx+side*(500+row*145)*sx,baseY=gy-70-row*115,terraceW=240*sx;ctx.fillStyle='rgba(105,113,111,.94)';ctx.beginPath();ctx.roundRect(baseX-(side<0?terraceW:0),baseY-70,terraceW,92,14);ctx.fill();ctx.strokeStyle='rgba(42,54,56,.90)';ctx.lineWidth=6;ctx.stroke();for(let k=0;k<3;k++){const wx=baseX+side*(-42-k*62)*sx;ctx.fillStyle='#273b40';ctx.fillRect(wx-22*sx,baseY-39,44*sx,27);}const lx=baseX+side*-18*sx,ly=baseY-58;const g=ctx.createRadialGradient(lx,ly,0,lx,ly,24);g.addColorStop(0,'rgba(255,190,99,.76)');g.addColorStop(1,'rgba(255,130,45,0)');ctx.fillStyle=g;ctx.fillRect(lx-24,ly-24,48,48);}
  // Ice floes are deterministic fractured polygons; avoid stamp-like repeated ellipses.
  ctx.fillStyle='rgba(224,239,241,.62)';ctx.strokeStyle='rgba(247,253,252,.72)';ctx.lineWidth=3;
  for(let i=0;i<9;i++){
   const seed=770+i*31,x=cx+(this.detailHash(seed)-.5)*900,y=gy+170+this.detailHash(seed+4)*520;
   const rx=24+this.detailHash(seed+7)*45,ry=12+this.detailHash(seed+9)*20,verts=6+Math.floor(this.detailHash(seed+12)*3),rot=this.detailHash(seed+2)*Math.PI;
   ctx.beginPath();
   for(let k=0;k<verts;k++){const a=rot+Math.PI*2*k/verts,r=.72+this.detailHash(seed+k*19+20)*.35,px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;if(k===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
   ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='rgba(177,211,216,.48)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-rx*.35,y);ctx.lineTo(x+rx*.28,y-ry*.12);ctx.stroke();ctx.strokeStyle='rgba(247,253,252,.72)';ctx.lineWidth=3;
  }
  ctx.restore();
 }

 drawCanyonWaterfalls(ctx,scroll,time){
  const xScale=this.worldWidth/2605.7861328125;
  const falls=[
   {x:780*xScale,y:-4560,h:155,w:24},{x:1880*xScale,y:-4665,h:178,w:28},
   {x:690*xScale,y:-4845,h:132,w:21},{x:1970*xScale,y:-4470,h:118,w:20},
  ];
  ctx.save();ctx.lineCap='round';ctx.globalCompositeOperation='screen';
  for(let i=0;i<falls.length;i++){
   const f=falls[i],y=f.y+scroll;if(y+f.h<-200||y>1600)continue;
   const sway=Math.sin(time*1.7+i*1.13)*5,phase=.72+.28*Math.sin(time*2.4+i);
   const grad=ctx.createLinearGradient(f.x,y,f.x+sway,y+f.h);grad.addColorStop(0,'rgba(226,248,249,.78)');grad.addColorStop(.45,'rgba(151,223,230,.62)');grad.addColorStop(1,'rgba(84,182,198,.18)');
   ctx.strokeStyle=grad;ctx.lineWidth=f.w;ctx.beginPath();ctx.moveTo(f.x,y);ctx.bezierCurveTo(f.x-8,y+f.h*.35,f.x+sway+9,y+f.h*.66,f.x+sway,y+f.h);ctx.stroke();
   ctx.strokeStyle='rgba(246,255,255,.72)';ctx.lineWidth=Math.max(3,f.w*.22);ctx.beginPath();ctx.moveTo(f.x-2,y+3);ctx.bezierCurveTo(f.x+4,y+f.h*.4,f.x+sway-4,y+f.h*.7,f.x+sway+2,y+f.h);ctx.stroke();
   ctx.globalAlpha=.22+.18*phase;ctx.fillStyle='rgba(220,249,251,.92)';ctx.beginPath();ctx.ellipse(f.x+sway,y+f.h+8,36+f.w,12+f.w*.24,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  ctx.restore();
 }

 drawDamSpray(ctx,scroll,time){
  const dam=(this.map.maritimeStructures??[]).find(s=>s.kind==='dam');if(!dam)return;
  const b=this.bounds(dam.points),x=(b.minX+b.maxX)/2,y=b.maxY+scroll+18;
  if(y<-220||y>1600)return;
  ctx.save();ctx.lineCap='round';
  const pulse=.82+.18*Math.sin(time*3.1);
  for(let i=0;i<7;i++){
   const ox=(i-3)*42,phase=time*2.2+i*.73,drop=48+(Math.sin(phase)*.5+.5)*38;
   ctx.globalAlpha=.24+.18*pulse;ctx.strokeStyle='rgba(210,246,249,.92)';ctx.lineWidth=9;
   ctx.beginPath();ctx.moveTo(x+ox,y-22);ctx.quadraticCurveTo(x+ox+Math.sin(phase)*10,y+drop*.35,x+ox+Math.sin(phase*.7)*14,y+drop);ctx.stroke();
   ctx.globalAlpha=.14+.10*pulse;ctx.fillStyle='rgba(235,252,252,.95)';ctx.beginPath();ctx.ellipse(x+ox,y+drop+12,26+8*pulse,9+3*pulse,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 cloudHash(n){return ((Math.sin(n*91.7+17.3)*43758.5453)%1+1)%1;}
 cloudInstances(zone,scroll,time){
  const count=Math.max(2,Math.round(3+zone.cloudDensity*9)),out=[];
  for(let i=0;i<count;i++){
   const seed=(zone.id.length*31+i*17);
   const w=150+this.cloudHash(seed+1)*210,h=w*(.28+this.cloudHash(seed+2)*.18);
   const speed=(zone.speed??8)*(0.45+this.cloudHash(seed+3)*.75);
   const baseX=this.cloudHash(seed+4)*(this.worldWidth+w*2)-w;
   const drift=(time*speed+scroll*.018*(.5+this.cloudHash(seed+5)))%(this.worldWidth+w*2);
   const x=((baseX+drift+w)%(this.worldWidth+w*2))-w;
   const worldY=zone.y+this.cloudHash(seed+6)*zone.height;
   out.push({x,y:worldY+scroll,w,h,seed});
  }
  return out;
 }
 drawCloudBlob(ctx,c,alpha,tint='255,255,255'){
  ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=alpha;
  const g=ctx.createRadialGradient(0,0,5,0,0,c.w*.55);g.addColorStop(0,`rgba(${tint},.92)`);g.addColorStop(.55,`rgba(${tint},.48)`);g.addColorStop(1,`rgba(${tint},0)`);ctx.fillStyle=g;
  for(let k=0;k<5;k++){const ox=(this.cloudHash(c.seed+k*3)-.5)*c.w*.42,oy=(this.cloudHash(c.seed+k*5+2)-.5)*c.h*.50,r=c.w*(.22+this.cloudHash(c.seed+k*7+1)*.16);ctx.beginPath();ctx.ellipse(ox,oy,r,r*.42,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 drawCloudShadows(ctx,scroll,time){
  for(const zone of this.visibleAtmosphereZones??[]){for(const c of this.cloudInstances(zone,scroll,time)){ctx.save();ctx.translate(c.x+36,c.y+54);ctx.globalAlpha=zone.shadowOpacity??.1;ctx.fillStyle='rgba(8,24,29,.72)';ctx.beginPath();ctx.ellipse(0,0,c.w*.38,c.h*.36,-.08,0,Math.PI*2);ctx.fill();ctx.restore();}}
 }
 drawCloudLayer(ctx,scroll,time){
  for(const zone of this.visibleAtmosphereZones??[]){
   const snow=zone.kind==='snow-clouds',mist=zone.kind==='mountain-mist'||zone.kind==='dam-spray';
   for(const c of this.cloudInstances(zone,scroll,time))this.drawCloudBlob(ctx,c,(snow?.36:mist?.25:.18)+zone.cloudDensity*.18,snow?'240,246,250':'244,249,247');
   if(zone.fogAlpha>0){const y=zone.y+scroll,h=zone.height;ctx.save();const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(220,235,238,0)');g.addColorStop(.5,`rgba(220,235,238,${zone.fogAlpha})`);g.addColorStop(1,'rgba(220,235,238,0)');ctx.fillStyle=g;ctx.fillRect(this.map.bounds.minX,y,this.worldWidth,h);ctx.restore();}
  }
 }
 drawContactRipples(ctx,scroll,time){
  ctx.save();ctx.strokeStyle='#a8e6dc';ctx.lineCap='round';
  for(const s of this.visibleDockSockets){const x=s.x,y=s.y+scroll;for(let i=0;i<3;i++){
   const p=(time*.28+i/3)%1;ctx.globalAlpha=(1-p)*.24;ctx.lineWidth=1.7-p;ctx.beginPath();ctx.ellipse(x,y+14,13+p*38,5+p*11,0,.05,Math.PI-.05);ctx.stroke();
  }}ctx.restore();
 }
 drawNavigationLights(ctx,scroll,time){
  ctx.save();for(const s of this.visibleDockSockets){const x=s.x,y=s.y+scroll;const on=Math.sin(time*2.3+s.y*.02)>-.2;ctx.globalAlpha=on?.9:.3;
   const g=ctx.createRadialGradient(x,y,0,x,y,13);g.addColorStop(0,'#ffc46f');g.addColorStop(.15,'#e98f4c');g.addColorStop(1,'rgba(235,150,55,0)');ctx.fillStyle=g;ctx.fillRect(x-13,y-13,26,26);ctx.fillStyle='#f9eed8';ctx.fillRect(x-1,y-1,2,2);
  }ctx.restore();
 }
 destroy(){this.water.destroy();this.moduleMaterials.clear();this.moduleMasks.clear();this.textures.clear();this.authoredAssets.clear();for(const c of this.chunks.values())c.contact.width=c.structure.width=1;this.chunks.clear();this.cacheBytes=0;}
}