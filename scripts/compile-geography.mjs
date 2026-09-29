import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {validateTiledGeography} from './lib/geography-validator.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const src=join(root,'dist/maps/coastal-intercept.tmj');
const out=join(root,'dist/src/game/content/coastalGeographyData.js');
const map=JSON.parse(await readFile(src,'utf8'));
const validation=validateTiledGeography(map);
if(!validation.ok)throw Error(`Geography validation failed:\n- ${validation.errors.join('\n- ')}`);

const layer=(name)=>{const l=map.layers?.find(x=>x.name===name);if(!l)throw Error(`Required Tiled layer missing: ${name}`);return l;};
const prop=(obj,name,fallback=null)=>obj.properties?.find(p=>p.name===name)?.value??fallback;
const sourceMinX=Number(map.properties?.find(p=>p.name==='min_x')?.value??0);
const sourceMaxX=Number(map.properties?.find(p=>p.name==='max_x')?.value??0);
const sourceWidth=Math.max(1e-9,sourceMaxX-sourceMinX);
const runtimeWidth=Number(map.properties?.find(p=>p.name==='runtime_width')?.value??sourceWidth);
const runtimeMinX=0;
const runtimeXScale=runtimeWidth/sourceWidth;
const tx=(x)=>runtimeMinX+(Number(x)-sourceMinX)*runtimeXScale;
const tw=(w)=>Number(w)*runtimeXScale;
const points=(obj,key)=>{const ox=obj.x??0,oy=obj.y??0;return (obj[key]??[]).map(p=>({x:tx(p.x+ox),y:p.y+oy}));};
const polygon=(obj)=>({id:obj.name,points:points(obj,'polygon'),material:prop(obj,'material',obj.class),...(prop(obj,'elevation')!=null?{elevation:prop(obj,'elevation')}:{}),...(prop(obj,'kind')?{kind:prop(obj,'kind')}: {})});
const road=(obj)=>({
 id:obj.name,points:points(obj,'polyline'),width:Number(prop(obj,'width',50)),material:prop(obj,'material','road'),class:prop(obj,'road_class','service'),
 fromNode:prop(obj,'from_node'),toNode:prop(obj,'to_node'),junctionNodes:String(prop(obj,'junction_nodes','')).split(',').filter(Boolean),
});
const roadNode=(obj)=>({id:obj.name,x:tx(obj.x??0),y:obj.y??0});
const shoreline=(obj)=>({id:obj.name,points:points(obj,'polyline'),districtId:prop(obj,'district_id'),contactKind:prop(obj,'contact_kind','rock'),waterSide:prop(obj,'water_side','right'),height:Number(prop(obj,'height',0))});
const rect=(obj)=>({id:obj.name,x:tx(obj.x??0),y:obj.y??0,width:tw(obj.width??0),height:obj.height??0,rotation:(obj.rotation??0)*Math.PI/180,...(prop(obj,'kind')?{kind:prop(obj,'kind')}:{}),...(prop(obj,'asset')?{asset:prop(obj,'asset')}:{}),...(prop(obj,'elevation')!=null?{elevation:prop(obj,'elevation')}:{}),...(prop(obj,'alpha')!=null?{alpha:prop(obj,'alpha')}: {}),...(prop(obj,'landmark_type')?{landmarkType:prop(obj,'landmark_type')}: {})});
const bridge=(obj)=>({
 id:obj.name,kind:'bridge',x:tx(obj.x??0),y:obj.y??0,width:tw(obj.width??0),height:obj.height??0,rotation:(obj.rotation??0)*Math.PI/180,elevation:Number(prop(obj,'elevation',0)),
 a:{x:tx(Number(prop(obj,'a_x'))),y:Number(prop(obj,'a_y'))},b:{x:tx(Number(prop(obj,'b_x'))),y:Number(prop(obj,'b_y'))},connects:String(prop(obj,'connects','')).split(',').filter(Boolean),
 fromNode:prop(obj,'from_node'),toNode:prop(obj,'to_node'),
});
const socket=(obj)=>({id:obj.name,anchorId:prop(obj,'anchor_id',obj.name),district:prop(obj,'district'),role:prop(obj,'role'),x:tx(obj.x??0),y:obj.y??0});
const district=(obj)=>({id:obj.name,name:prop(obj,'display_name',obj.name),maxY:Number(prop(obj,'max_y',obj.y+(obj.height??0))),minY:Number(prop(obj,'min_y',obj.y)),biome:prop(obj,'biome','temperate-coast'),elevationBand:Number(prop(obj,'elevation_band',0))});
const atmosphere=(obj)=>({id:obj.name,x:tx(obj.x??0),y:obj.y??0,width:tw(obj.width??0),height:obj.height??0,kind:prop(obj,'kind','coastal-clouds'),cloudDensity:Number(prop(obj,'cloud_density',0.3)),shadowOpacity:Number(prop(obj,'shadow_opacity',0.1)),fogAlpha:Number(prop(obj,'fog_alpha',0.04)),speed:Number(prop(obj,'speed',8))});
const waterRegion=(obj)=>({id:obj.name,districtId:prop(obj,'district_id','multi-district'),bodyId:prop(obj,'body_id'),points:points(obj,'polygon'),depthClass:prop(obj,'depth_class','deep'),flowX:Number(prop(obj,'flow_x',0)),flowY:Number(prop(obj,'flow_y',0)),iceCoverage:Number(prop(obj,'ice_coverage',0))});
const reliefZone=(obj)=>({id:obj.name,districtId:prop(obj,'district_id'),points:points(obj,'polygon'),kind:prop(obj,'relief_kind','rock-terrace'),height:Number(prop(obj,'height',80)),roughness:Number(prop(obj,'roughness',0.6)),shelfCount:Number(prop(obj,'shelf_count',3)),seed:Number(prop(obj,'seed',1))});
const materialZone=(obj)=>({id:obj.name,districtId:prop(obj,'district_id'),points:points(obj,'polygon'),kind:prop(obj,'material_kind','weathering'),opacity:Number(prop(obj,'opacity',0.2)),scale:Number(prop(obj,'scale',1)),seed:Number(prop(obj,'seed',1))});
const vegetationZone=(obj)=>({id:obj.name,districtId:prop(obj,'district_id'),points:points(obj,'polygon'),kind:prop(obj,'vegetation_kind','scrub'),density:Number(prop(obj,'density',0.3)),minSize:Number(prop(obj,'min_size',8)),maxSize:Number(prop(obj,'max_size',24)),seed:Number(prop(obj,'seed',1))});
const shadowCaster=(obj)=>({id:obj.name,districtId:prop(obj,'district_id'),points:points(obj,'polygon'),kind:prop(obj,'shadow_kind','terrain'),offsetX:tw(Number(prop(obj,'offset_x',36))),offsetY:Number(prop(obj,'offset_y',54)),opacity:Number(prop(obj,'opacity',0.2)),blur:Number(prop(obj,'blur',18))});
const artInstance=(obj)=>{
 const x=tx(Number(obj.x??0)),y=Number(obj.y??0),visualWidth=Number(prop(obj,'visual_width',0)),visualHeight=Number(prop(obj,'visual_height',0)),groundWidth=Number(prop(obj,'ground_width',0)),groundHeight=Number(prop(obj,'ground_height',0));
 return {id:obj.name,districtId:prop(obj,'district_id'),assetId:prop(obj,'asset_id'),x,y,rotation:(obj.rotation??0)*Math.PI/180,elevation:Number(prop(obj,'elevation',0)),renderLayer:prop(obj,'render_layer','ground'),groundFootprint:{minX:x-groundWidth/2,maxX:x+groundWidth/2,minY:y-groundHeight,maxY:y},visualBounds:{minX:x-visualWidth/2,maxX:x+visualWidth/2,minY:y-visualHeight,maxY:y},stateKey:prop(obj,'state_key','')||null};
};
const referenceLine=(obj)=>({id:obj.name,points:points(obj,'polyline'),source:prop(obj,'source','approved-master-reference')});
const mprop=(name,fallback=null)=>map.properties?.find(p=>p.name===name)?.value??fallback;
const sourceScale=Number(mprop('reference_scale'));
const referenceRegistration={
 width:Number(mprop('reference_width')),height:Number(mprop('reference_height')),
 scaleX:runtimeWidth/Number(mprop('reference_width')),scaleY:sourceScale,
 originX:runtimeMinX,originY:Number(mprop('reference_origin_y')),
 sourceScale,projection:mprop('runtime_projection','portrait-composition-x-compression'),
};

const roads=layer('Roads').objects.map(road);
const roadNodes=layer('Road Nodes').objects.map(roadNode);
const bridges=layer('Bridges').objects.map(bridge);
const graphSegments=[];
for(const r of roads){
 const chain=[r.fromNode,...r.junctionNodes,r.toNode].filter(Boolean);
 for(let i=1;i<chain.length;i++)graphSegments.push({id:`road:${r.id}:${i-1}`,kind:'road',roadId:r.id,from:chain[i-1],to:chain[i]});
}
for(const b of bridges)if(b.fromNode&&b.toNode)graphSegments.push({id:`bridge:${b.id}`,kind:'bridge',bridgeId:b.id,from:b.fromNode,to:b.toNode});

const data={
 id:mprop('map_id','coastal-intercept-master'),
 version:Number(mprop('geography_version',1)),
 inspiration:mprop('inspiration','authored fictional geography'),
 pipeline:mprop('geography_pipeline','Tiled TMJ -> validator/compiler -> runtime'),
 encounterOwnedGeometry:Boolean(mprop('encounter_owned_geometry',false)),
 referenceRegistration,
 bounds:{minX:runtimeMinX,maxX:runtimeMinX+runtimeWidth,minY:Number(mprop('min_y',0)),maxY:Number(mprop('max_y',0))},
 districts:layer('Districts').objects.map(district),
 shorelines:layer('Shorelines').objects.map(shoreline),
 landPolygons:layer('Land').objects.map(polygon),
 waterPolygons:layer('Water Cutouts').objects.map(polygon),
 waterRegions:layer('Water Regions').objects.map(waterRegion),
 reliefZones:layer('Relief Zones').objects.map(reliefZone),
 materialZones:layer('Material Zones').objects.map(materialZone),
 vegetationZones:layer('Vegetation Zones').objects.map(vegetationZone),
 shadowCasters:layer('Shadow Casters').objects.map(shadowCaster),
 artInstances:layer('Art Instances').objects.map(artInstance),
 roads,
 roadNodes,
 roadGraph:{segments:graphSegments},
 concretePolygons:layer('Concrete').objects.map(polygon),
 dockPolygons:layer('Docks').objects.map(polygon),
 maritimeStructures:layer('Maritime Structures').objects.map(polygon),
 bridges,
 landmarks:layer('Landmarks').objects.map(rect),
 decorations:layer('Decorations').objects.map(rect),
 sockets:layer('Sockets').objects.map(socket),
 referenceTrace:layer('Reference Trace').objects.map(referenceLine),
 atmosphereZones:layer('Atmosphere Zones').objects.map(atmosphere),
};

const ids=[];for(const group of [data.landPolygons,data.waterPolygons,data.waterRegions,data.reliefZones,data.materialZones,data.vegetationZones,data.shadowCasters,data.artInstances,data.roads,data.roadNodes,data.concretePolygons,data.dockPolygons,data.maritimeStructures,data.bridges,data.landmarks,data.decorations,data.sockets])for(const item of group)ids.push(item.id);
if(new Set(ids).size!==ids.length)throw Error('Duplicate geography object id in Tiled source');
if(data.districts.length<15)throw Error('Level 1 geography must define the fifteen-district reference journey');
if(data.referenceTrace.length<3)throw Error('Level 1 geography requires authored reference trace lines');
if(data.atmosphereZones.length<6)throw Error('Level 1 geography requires authored atmosphere progression');
if(data.sockets.some(s=>!s.role||!s.district||!s.anchorId))throw Error('Every semantic socket needs role, district and anchorId');
if(data.roads.some(r=>r.points.length<2||r.width<=0))throw Error('Every road needs a polyline and positive width');
if(data.landPolygons.some(p=>p.points.length<3))throw Error('Every land polygon needs at least three points');
if(data.waterRegions.some(r=>r.points.length<3||!r.bodyId||!['deep','shallow','river'].includes(r.depthClass)||r.iceCoverage<0||r.iceCoverage>1))throw Error('Every water region needs polygon, bodyId, valid depthClass and iceCoverage 0..1');
if(data.reliefZones.some(z=>z.points.length<3||!z.districtId||!Number.isFinite(z.height)||z.height<=0||!Number.isFinite(z.roughness)||z.roughness<0||z.roughness>1||!Number.isFinite(z.shelfCount)||z.shelfCount<1))throw Error('Every relief zone needs polygon/district plus positive height, roughness 0..1 and shelfCount >=1');
if(data.materialZones.some(z=>z.points.length<3||!z.districtId||!z.kind||!Number.isFinite(z.opacity)||z.opacity<0||z.opacity>1||!Number.isFinite(z.scale)||z.scale<=0))throw Error('Every material zone needs polygon/district/kind plus opacity 0..1 and positive scale');
if(data.vegetationZones.some(z=>z.points.length<3||!z.districtId||!z.kind||!Number.isFinite(z.density)||z.density<0||z.density>1||!Number.isFinite(z.minSize)||!Number.isFinite(z.maxSize)||z.minSize<=0||z.maxSize<z.minSize))throw Error('Every vegetation zone needs polygon/district/kind plus valid density and size range');
if(data.shadowCasters.some(z=>z.points.length<3||!z.districtId||!Number.isFinite(z.opacity)||z.opacity<0||z.opacity>1||!Number.isFinite(z.blur)||z.blur<0))throw Error('Every shadow caster needs polygon/district plus opacity 0..1 and non-negative blur');
if(data.artInstances.some(i=>!i.assetId||!i.districtId||!['terrain','ground','elevated'].includes(i.renderLayer)||!Number.isFinite(i.elevation)||i.visualBounds.maxX<=i.visualBounds.minX||i.visualBounds.maxY<=i.visualBounds.minY||i.groundFootprint.maxX<=i.groundFootprint.minX||i.groundFootprint.maxY<=i.groundFootprint.minY))throw Error('Every art instance needs district/asset/layer/elevation plus positive visual and ground bounds');
if(data.shorelines.some(s=>!s.districtId||!['beach','rock','quay','ice'].includes(s.contactKind)||!['left','right'].includes(s.waterSide)||!Number.isFinite(s.height)))throw Error('Every shoreline needs districtId/contactKind/waterSide/height metadata');
if(!Number.isFinite(referenceRegistration.width)||!Number.isFinite(referenceRegistration.height)||referenceRegistration.width<=0||referenceRegistration.height<=0)throw Error('Reference registration requires positive source width/height');
if(!Number.isFinite(referenceRegistration.scaleX)||referenceRegistration.scaleX<=0||!Number.isFinite(referenceRegistration.scaleY)||referenceRegistration.scaleY<=0||!Number.isFinite(referenceRegistration.originX)||!Number.isFinite(referenceRegistration.originY))throw Error('Reference registration contains invalid numeric values');
const expectedMaxX=referenceRegistration.originX+referenceRegistration.width*referenceRegistration.scaleX;
const expectedMaxY=referenceRegistration.originY+referenceRegistration.height*referenceRegistration.scaleY;
if(Math.abs(data.bounds.minX-referenceRegistration.originX)>1e-7||Math.abs(data.bounds.minY-referenceRegistration.originY)>1e-7||Math.abs(data.bounds.maxX-expectedMaxX)>1e-7||Math.abs(data.bounds.maxY-expectedMaxY)>1e-7)throw Error('Reference registration does not agree with authored world bounds');

await writeFile(out,`// GENERATED from dist/maps/coastal-intercept.tmj by scripts/compile-geography.mjs.\n// Edit the TMJ in Tiled; do not hand-edit this file.\nexport const COASTAL_GEOGRAPHY_DATA=${JSON.stringify(data,null,2)};\n`);
console.log(`Compiled Tiled geography v${data.version}: ${data.districts.length} districts, ${data.roadNodes.length} road nodes, ${data.sockets.length} sockets -> ${out}`);
