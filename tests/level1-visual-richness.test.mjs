import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {COASTAL_GEOGRAPHY} from '../dist/src/game/content/coastalGeography.js';
import {LEVEL1_ART} from '../dist/src/game/content/level1Art.js';
import {drawAuthoredStructures} from '../dist/src/game/render/AuthoredStructures.js';

const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');

function fakeContext(){
 const calls=[];
 return {
  calls,
  save(){},restore(){},translate(){},rotate(){},
  set globalAlpha(v){},set filter(v){},
  drawImage(...args){calls.push(args)},
 };
}

test('authored structures use the instance visual bounds without non-uniform squeezing',()=>{
 const ctx=fakeContext();
 const image={};
 const assets=new Map([['x',{image,definition:{sourcePixelWidth:200,sourcePixelHeight:100,pivotX:100,pivotY:100,pixelsPerWorldUnit:1,castsShadow:false}}]]);
 const instance={assetId:'x',x:100,y:200,rotation:0,elevation:0,renderLayer:'ground',visualBounds:{minX:0,maxX:300,minY:50,maxY:200}};
 drawAuthoredStructures(ctx,[instance],assets,'ground',0);
 assert.equal(ctx.calls.length,1);
 const [,dx,dy,w,h]=ctx.calls[0];
 assert.equal(w,300);
 assert.equal(h,150);
 assert.equal(w/h,2,'source aspect ratio must be preserved');
 assert.equal(dx,-150);
 assert.equal(dy,-150);
});

test('major Level 1 architecture is served as detailed raster sprites',async()=>{
 const required=['civil-house','industrial-hall','crane','warship-static','radar','dam-face','fortress-terrace','citadel-gate','citadel-wing','citadel-tower','tunnel-mouth'];
 for(const id of required){
  const def=LEVEL1_ART[id];
  assert.ok(def,`missing ${id}`);
  assert.match(def.url,/\.png$/i,`${id} should use a rasterized high-detail runtime sprite`);
  const s=await stat(new URL(`../dist/${def.url}`,import.meta.url));
  assert.ok(s.size>10_000,`${id} sprite is suspiciously small (${s.size} bytes)`);
 }
});

test('harbour, dam and fortress are populated with enough explicit authored structures',()=>{
 const arts=COASTAL_GEOGRAPHY.artInstances;
 assert.ok(arts.length>=52,`expected at least 52 authored structures, found ${arts.length}`);
 const districtCount=(id)=>arts.filter(x=>x.districtId===id).length;
 assert.ok(districtCount('civil-harbour')>=10,'civil harbour lacks architectural density');
 assert.ok(districtCount('industrial-harbour')>=10,'industrial harbour lacks architectural density');
 assert.ok(districtCount('naval-yard')>=12,'naval yard lacks architectural density');
 assert.ok(districtCount('citadel-basin')>=9,'citadel basin lacks architectural density');
});

test('constructed terrain uses projected cliff faces, deterministic micro-detail and live waterfalls',()=>{
 assert.match(coastal,/drawProjectedCliffFaces\(/);
 assert.match(coastal,/drawTerrainMicroDetail\(/);
 assert.match(coastal,/drawCanyonWaterfalls\(/);
 assert.doesNotMatch(coastal,/lineWidth=74/,'old thick-outline cliff shortcut must be gone');
});

test('gateway bridge is a fortified bridge, not a suspension/cable approximation',()=>{
 assert.match(coastal,/drawFortifiedGatewayTower\(/);
 assert.match(coastal,/drawBridgeUnderstructure\(/);
 assert.doesNotMatch(coastal,/deckY-towerH\+18\);ctx\.lineTo\(x\+w\*\.83,deckY-towerH\+18/,'bridge must not use the old top cable');
});

test('shore contact has distinct beach, rock, quay and ice treatments',async()=>{
 const shore=await readFile(new URL('../dist/src/game/render/ShoreEffects.js',import.meta.url),'utf8');
 for(const fn of ['drawBeachWash','drawRockContact','drawQuayContact','drawIceContact'])assert.match(shore,new RegExp(`${fn}\\(`),`missing ${fn}`);
 assert.match(shore,/contactKind==='beach'/);
 assert.match(shore,/contactKind==='quay'/);
 assert.match(shore,/contactKind==='ice'/);
});

function pngSize(buffer){
 assert.equal(buffer.toString('ascii',1,4),'PNG','expected PNG signature');
 return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
}

test('hero landmarks retain high-resolution source detail before gameplay downscaling',async()=>{
 const minima={
  'dam-face':[1200,600],
  'citadel-gate':[1000,680],
  'citadel-wing':[900,560],
  'citadel-tower':[480,700],
 };
 for(const [id,[minW,minH]] of Object.entries(minima)){
  const def=LEVEL1_ART[id];
  const bytes=await readFile(new URL(`../dist/${def.url}`,import.meta.url));
  const {width,height}=pngSize(bytes);
  assert.ok(width>=minW&&height>=minH,`${id} source is only ${width}x${height}`);
 }
});

test('alpine and fortress districts receive explicit mountain relief and retaining-wall depth',()=>{
 assert.match(coastal,/drawRelief\(/,'missing authored relief pass');
 assert.match(coastal,/drawMountainRoadDepth\(/,'missing mountain road depth pass');
});

test('dam and citadel have dedicated composition passes rather than relying on isolated sprites',()=>{
 assert.match(coastal,/drawCurvedDamArchitecture\(/,'dam needs a curved structural composition pass');
 assert.match(coastal,/drawCitadelBasinDetails\(/,'citadel needs basin-integrated composition detail');
});

test('citadel hero architecture is registered against the citadel core rather than floating down-basin',()=>{
 const gate=COASTAL_GEOGRAPHY.artInstances.find(x=>x.id==='citadel-gate-main');
 const core=COASTAL_GEOGRAPHY.landmarks.find(x=>x.id==='citadel-core');
 assert.ok(gate&&core,'citadel gate/core missing');
 const gateCenterY=(gate.visualBounds.minY+gate.visualBounds.maxY)/2;
 const coreCenterY=core.y+core.height/2;
 assert.ok(Math.abs(gateCenterY-coreCenterY)<140,`citadel gate centre is ${Math.round(Math.abs(gateCenterY-coreCenterY))} world units away from the core centre`);
});

test('bridge watch-fort is a compact downstream rock landmark, not a long island directly under the deck',()=>{
 const islet=COASTAL_GEOGRAPHY.landPolygons.find(x=>x.id==='bridge-fort-islet');
 const bridge=COASTAL_GEOGRAPHY.bridges.find(x=>x.id==='narrows-bridge');
 assert.ok(islet&&bridge);
 const xs=islet.points.map(p=>p.x),ys=islet.points.map(p=>p.y);
 const width=Math.max(...xs)-Math.min(...xs),centerY=(Math.min(...ys)+Math.max(...ys))/2;
 assert.ok(width<360,`watch-fort islet is too wide (${width.toFixed(1)})`);
 assert.ok(centerY-bridge.y>280,`watch-fort is only ${(centerY-bridge.y).toFixed(1)} units downstream of bridge`);
 assert.ok(COASTAL_GEOGRAPHY.artInstances.some(x=>x.assetId==='coastal-watchtower'&&x.districtId==='bridge-gateway'),'bridge gateway lacks the source watch-fort tower');
});

test('bridge gateway receives dedicated limestone cliff relief instead of flat green banks',()=>{
 assert.match(coastal,/drawCoastalCliffRelief\(/,'missing gateway limestone cliff relief pass');
 assert.match(coastal,/bridge-gateway/,'gateway relief must be keyed to the authored district');
});

test('compiled Level 1 exposes explicit relief, material, vegetation and shadow visual zones',()=>{
 for(const key of ['reliefZones','materialZones','vegetationZones','shadowCasters']){
  assert.ok(Array.isArray(COASTAL_GEOGRAPHY[key]),`missing compiled ${key}`);
  assert.ok(COASTAL_GEOGRAPHY[key].length>0,`${key} must not be empty`);
 }
 const heroes=new Set(['bridge-gateway','civil-harbour','industrial-harbour','naval-yard','river-canyon','lower-dam','citadel-basin']);
 assert.ok(COASTAL_GEOGRAPHY.reliefZones.some(z=>heroes.has(z.districtId)),'hero districts need authored relief zones');
 assert.ok(COASTAL_GEOGRAPHY.materialZones.some(z=>heroes.has(z.districtId)),'hero districts need authored material zones');
});

test('bridge gateway is composed from dedicated bank-integrated hero assets on both sides',()=>{
 for(const id of ['gateway-keep','gateway-arch-support'])assert.ok(LEVEL1_ART[id],`missing ${id} art registry entry`);
 const bridgeArts=COASTAL_GEOGRAPHY.artInstances.filter(x=>x.districtId==='bridge-gateway');
 assert.ok(bridgeArts.filter(x=>x.assetId==='gateway-keep').length>=2,'gateway needs a keep on each bank');
 assert.ok(bridgeArts.filter(x=>x.assetId==='gateway-terrace').length<=2,'gateway must not be dominated by long arcade terrace stamps');
 assert.ok(bridgeArts.filter(x=>x.assetId==='gateway-arch-support').length>=2,'gateway needs visible support architecture');
 const xs=bridgeArts.filter(x=>x.assetId==='gateway-keep').map(x=>x.x),mid=(COASTAL_GEOGRAPHY.bounds.minX+COASTAL_GEOGRAPHY.bounds.maxX)/2;
 assert.ok(Math.min(...xs)<mid*.72&&Math.max(...xs)>mid*1.28,'gateway keeps must frame both sides of the channel');
});

test('harbour districts use connected quay, ramp, marina and service-yard modules rather than sparse pads',()=>{
 for(const id of ['quay-edge','harbour-ramp','marina-pier','service-yard'])assert.ok(LEVEL1_ART[id],`missing ${id}`);
 const arts=COASTAL_GEOGRAPHY.artInstances;
 const civil=arts.filter(x=>x.districtId==='civil-harbour'&&['quay-edge','marina-pier','harbour-ramp'].includes(x.assetId));
 const heavy=arts.filter(x=>['industrial-harbour','naval-yard'].includes(x.districtId)&&['quay-edge','harbour-ramp','service-yard'].includes(x.assetId));
 assert.ok(civil.length>=8,`civil harbour needs >=8 connected edge/pier modules, found ${civil.length}`);
 assert.ok(heavy.length>=14,`industrial/naval harbour needs >=14 service/edge modules, found ${heavy.length}`);
 const mid=(COASTAL_GEOGRAPHY.bounds.minX+COASTAL_GEOGRAPHY.bounds.maxX)/2;
 const west=heavy.filter(x=>x.x<mid).map(x=>Math.round(x.y)).sort((a,b)=>a-b);
 const east=heavy.filter(x=>x.x>=mid).map(x=>Math.round(x.y)).sort((a,b)=>a-b);
 assert.notDeepEqual(west,east,'port compositions should be intentionally asymmetric rather than mirrored');
});

test('canyon and dam use dedicated abutment, gallery and retaining-wall architecture',()=>{
 for(const id of ['dam-abutment','dam-service-gallery','canyon-retaining-wall'])assert.ok(LEVEL1_ART[id],`missing ${id}`);
 const arts=COASTAL_GEOGRAPHY.artInstances;
 assert.ok(arts.filter(x=>x.districtId==='lower-dam'&&x.assetId==='dam-abutment').length>=2,'dam needs two cliff-bound abutments');
 assert.ok(arts.filter(x=>x.districtId==='lower-dam'&&x.assetId==='dam-service-gallery').length>=2,'dam needs service galleries');
 assert.ok(arts.filter(x=>['river-canyon','lower-dam'].includes(x.districtId)&&x.assetId==='canyon-retaining-wall').length>=4,'canyon needs multiple supported road retaining walls');
});


test('citadel basin uses mountain-integration architecture and irregular polygonal ice',()=>{
 for(const id of ['fortress-buttress','fortress-snow-terrace'])assert.ok(LEVEL1_ART[id],`missing ${id}`);
 const arts=COASTAL_GEOGRAPHY.artInstances;
 assert.ok(arts.filter(x=>x.districtId==='citadel-basin'&&x.assetId==='fortress-buttress').length>=2,'citadel needs two mountain-integrated buttresses');
 assert.ok(arts.filter(x=>['fortress-approach','citadel-basin'].includes(x.districtId)&&x.assetId==='fortress-snow-terrace').length>=2,'citadel needs snow terraces integrated into the basin');
 const start=coastal.indexOf(' drawCitadelBasinDetails(ctx,scroll,time){'),end=coastal.indexOf('drawCanyonWaterfalls(',start);
 const body=coastal.slice(start,end);
 assert.match(body,/lineTo\(/,'citadel ice should use irregular polygon vertices');
 assert.doesNotMatch(body,/ctx\.ellipse\(x,y,rx,ry/,'citadel ice should not be regular ellipse stamps');
});


test('bridge-left reference window stays rocky/forested instead of being invaded by the civil concrete apron',()=>{
 const map=COASTAL_GEOGRAPHY;
 const apron=map.concretePolygons.find(x=>x.id==='outer-harbour-apron');
 assert.ok(apron,'missing west civil harbour apron');
 const minX=Math.min(...apron.points.map(p=>p.x));
 const width=map.bounds.maxX-map.bounds.minX,mid=(map.bounds.minX+map.bounds.maxX)/2;
 assert.ok(minX>=width*.265,`west civil apron begins at x=${minX}; it should stay near the harbour edge rather than cover the bridge-left cliff`);
 const westCivil=map.artInstances.filter(x=>x.districtId==='civil-harbour'&&x.assetId==='civil-house'&&x.x<mid);
 assert.ok(westCivil.every(x=>x.x>=width*.275),'west civil houses should cluster near the harbour, outside the bridge-left cliff review window');
});


test('hero terrain materials use large non-repeating source textures',async()=>{
 for(const file of ['land-tropical.png','land-alpine.png','land-snow.png']){
  const bytes=await readFile(new URL(`../dist/art/environment/${file}`,import.meta.url));
  const {width,height}=pngSize(bytes);
  assert.ok(width>=2048&&height>=2048,`${file} is only ${width}x${height}; hero terrain needs 2048px non-repeating masters`);
 }
});


test('bridge cliff vegetation is authored as pine forest rather than generic scrub',()=>{
 const bridgeVeg=COASTAL_GEOGRAPHY.vegetationZones.filter(z=>z.districtId==='bridge-gateway');
 assert.ok(bridgeVeg.length>=2,'bridge needs vegetation on both banks');
 assert.ok(bridgeVeg.every(z=>String(z.kind).includes('pine')),`bridge vegetation kinds are ${bridgeVeg.map(z=>z.kind).join(', ')}`);
});

test('harbour hero assets are generated from a shared oblique top-down construction pipeline',async()=>{
 const script=await readFile(new URL('../scripts/generate-harbour-assets.py',import.meta.url),'utf8').catch(()=> '');
 assert.match(script,/def draw_oblique_building\(/,'missing shared oblique building generator');
 for(const name of ['civil-house','industrial-hall','harbour-office','naval-bunker','service-yard','fuel-tank']){
  assert.match(script,new RegExp(name.replace('-','\\-')),`generator must own ${name}`);
 }
});

test('gateway hero assets are generated as top-down cliff-integrated fortifications',async()=>{
 const script=await readFile(new URL('../scripts/generate-gateway-assets.py',import.meta.url),'utf8').catch(()=> '');
 assert.match(script,/def draw_gateway_keep\(/);
 assert.match(script,/def draw_watchtower\(/);
 assert.match(script,/cliff_buttress/,'gateway keep should include cliff buttress massing');
 assert.match(script,/bridge_portal/,'gateway keep should expose a bridge portal/connection cue');
});

test('hero relief zones hug authored banks instead of spilling across the channel',()=>{
 const zones=COASTAL_GEOGRAPHY.reliefZones;
 const bridgeW=zones.find(z=>z.id==='bridge-west-limestone');
 const bridgeE=zones.find(z=>z.id==='bridge-east-limestone');
 const citW=zones.find(z=>z.id==='citadel-west-massif');
 const citE=zones.find(z=>z.id==='citadel-east-massif');
 assert.ok(bridgeW&&bridgeE&&citW&&citE,'missing hero relief zones');
 const maxX=z=>Math.max(...z.points.map(p=>p.x));
 const minX=z=>Math.min(...z.points.map(p=>p.x));
 const width=COASTAL_GEOGRAPHY.bounds.maxX-COASTAL_GEOGRAPHY.bounds.minX;
 assert.ok(maxX(bridgeW)<=width*.32,`bridge west relief spills to x=${maxX(bridgeW)}`);
 assert.ok(minX(bridgeE)>=width*.68,`bridge east relief spills to x=${minX(bridgeE)}`);
 assert.ok(maxX(citW)<=width*.35,`citadel west relief spills to x=${maxX(citW)}`);
 assert.ok(minX(citE)>=width*.65,`citadel east relief spills to x=${minX(citE)}`);
});

test('hero landmarks are framed by dedicated cliff and mountain shoulder modules',()=>{
 for(const id of ['gateway-cliff-bank','dam-canyon-shoulder','citadel-mountain-shoulder'])assert.ok(LEVEL1_ART[id],`missing ${id}`);
 const arts=COASTAL_GEOGRAPHY.artInstances;
 assert.ok(arts.filter(x=>x.districtId==='bridge-gateway'&&x.assetId==='gateway-cliff-bank').length>=2,'gateway needs cliff-bank modules on both sides');
 assert.ok(arts.filter(x=>x.districtId==='lower-dam'&&x.assetId==='dam-canyon-shoulder').length>=2,'dam needs canyon shoulders on both sides');
 assert.ok(arts.filter(x=>x.districtId==='citadel-basin'&&x.assetId==='citadel-mountain-shoulder').length>=2,'citadel needs mountain shoulders on both sides');
});

test('harbour water is populated with authored small craft rather than an empty central channel',()=>{
 assert.ok(LEVEL1_ART['civil-boat'],'missing civil-boat art');
 const boats=COASTAL_GEOGRAPHY.artInstances.filter(x=>x.assetId==='civil-boat');
 assert.ok(boats.filter(x=>x.districtId==='civil-harbour').length>=8,'civil harbour needs at least eight small craft');
 assert.ok(boats.filter(x=>x.districtId==='naval-yard').length>=4,'naval yard needs at least four support craft');
});

test('harbour wear zones stay on authored banks and do not stripe the navigable channel',()=>{
 const harbourKinds=new Set(['harbour-wear','industrial-wear','naval-wear']);
 const zones=COASTAL_GEOGRAPHY.materialZones.filter(z=>harbourKinds.has(z.kind));
 assert.ok(zones.length>=6,`expected split harbour bank zones, got ${zones.length}`);
 const inside=(x,y,pts)=>{let yes=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x))yes=!yes;}return yes;};
 const mid=(COASTAL_GEOGRAPHY.bounds.minX+COASTAL_GEOGRAPHY.bounds.maxX)/2;
 for(const [district,y] of [['civil-harbour',-2770],['industrial-harbour',-3250],['naval-yard',-3740]]){
  const districtZones=zones.filter(z=>z.districtId===district);
  assert.ok(districtZones.length>=2,`${district} needs separate west/east wear zones`);
  assert.equal(districtZones.some(z=>inside(mid,y,z.points)),false,`${district} wear enters the central water channel`);
 }
});

test('dam and citadel mountain shoulders frame the portrait channel instead of sitting outside the gameplay crop',()=>{
 const byId=new Map(COASTAL_GEOGRAPHY.artInstances.map(i=>[i.id,i]));
 const width=COASTAL_GEOGRAPHY.bounds.maxX-COASTAL_GEOGRAPHY.bounds.minX,mid=(COASTAL_GEOGRAPHY.bounds.minX+COASTAL_GEOGRAPHY.bounds.maxX)/2;
 for(const [westId,eastId] of [
  ['dam-canyon-shoulder-west','dam-canyon-shoulder-east'],
  ['citadel-mountain-shoulder-west','citadel-mountain-shoulder-east'],
 ]){
  const w=byId.get(westId),e=byId.get(eastId);assert.ok(w&&e,`missing ${westId}/${eastId}`);
  assert.ok(w.visualBounds.maxX>=mid-width*.08,`${westId} ends at ${w.visualBounds.maxX}, leaving the portrait canyon unframed`);
  assert.ok(e.visualBounds.minX<=mid+width*.08,`${eastId} starts at ${e.visualBounds.minX}, leaving the portrait canyon unframed`);
 }
});