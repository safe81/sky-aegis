import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {COASTAL_GEOGRAPHY as G} from '../dist/src/game/content/coastalGeography.js';

if(!process.argv.includes('--migration-only')){
 console.error('Refusing to export over authored Tiled geography. Use --migration-only to write a separate migration snapshot.');
 process.exit(2);
}

const root=fileURLToPath(new URL('../',import.meta.url));
let nextObjectId=1;
const property=(name,value,type=typeof value==='number'?'float':typeof value==='boolean'?'bool':'string')=>({name,type,value});
const props=(obj,skip=new Set())=>Object.entries(obj).filter(([k,v])=>!skip.has(k)&&!['id','points','x','y','width','height','a','b'].includes(k)&&['string','number','boolean'].includes(typeof v)).map(([k,v])=>property(k,v));
const polygonObject=(f,klass)=>({id:nextObjectId++,name:f.id,class:klass,x:0,y:0,polygon:f.points.map(p=>({x:p.x,y:p.y})),properties:props(f,new Set(['material','kind'])) .concat(f.material?[property('material',f.material)]:[],f.kind?[property('kind',f.kind)]:[])});
const polylineObject=(f,klass)=>({id:nextObjectId++,name:f.id,class:klass,x:0,y:0,polyline:f.points.map(p=>({x:p.x,y:p.y})),properties:props(f,new Set(['material','class','fromNode','toNode','junctionNodes'])).concat(f.width!=null?[property('width',f.width)]:[],f.material?[property('material',f.material)]:[],f.class?[property('road_class',f.class)]:[],f.fromNode?[property('from_node',f.fromNode)]:[],f.toNode?[property('to_node',f.toNode)]:[],f.junctionNodes?.length?[property('junction_nodes',f.junctionNodes.join(','))]:[])});
const rectObject=(f,klass)=>({id:nextObjectId++,name:f.id,class:klass,x:f.x,y:f.y,width:f.width??0,height:f.height??0,rotation:(f.rotation??0)*180/Math.PI,properties:props(f,new Set(['kind','asset','role','rotation'])).concat(f.kind?[property('kind',f.kind)]:[],f.asset?[property('asset',f.asset)]:[],f.role?[property('role',f.role)]:[])});
const pointObject=(f,klass)=>({id:nextObjectId++,name:f.id,class:klass,x:f.x,y:f.y,point:true,properties:props(f,new Set(['role','anchorId','district'])).concat(f.role?[property('role',f.role)]:[],f.anchorId?[property('anchor_id',f.anchorId)]:[],f.district?[property('district',f.district)]:[])});
const bridgeObject=(f)=>({id:nextObjectId++,name:f.id,class:'bridge',x:f.x,y:f.y,width:f.width,height:f.height,rotation:(f.rotation??0)*180/Math.PI,properties:[property('elevation',f.elevation??0),property('connects',f.connects.join(',')),property('a_x',f.a.x),property('a_y',f.a.y),property('b_x',f.b.x),property('b_y',f.b.y),property('from_node',f.fromNode??''),property('to_node',f.toNode??'')]});
const districtObject=(d)=>({id:nextObjectId++,name:d.id,class:'district',x:G.bounds.minX,y:d.minY,width:G.bounds.maxX-G.bounds.minX,height:d.maxY-d.minY,properties:[property('display_name',d.name),property('max_y',d.maxY),property('min_y',d.minY)]});
const layer=(id,name,objects)=>({id,name,type:'objectgroup',draworder:'topdown',visible:true,opacity:1,x:0,y:0,objects});

const layers=[];let lid=1;
layers.push(layer(lid++,'Districts',G.districts.map(districtObject)));
layers.push(layer(lid++,'Land',G.landPolygons.map(x=>polygonObject(x,'land'))));
layers.push(layer(lid++,'Water Cutouts',(G.waterPolygons??[]).map(x=>polygonObject(x,'water_cutout'))));
layers.push(layer(lid++,'Concrete',G.concretePolygons.map(x=>polygonObject(x,'concrete'))));
layers.push(layer(lid++,'Maritime Structures',(G.maritimeStructures??[]).map(x=>polygonObject(x,x.kind??'maritime'))));
layers.push(layer(lid++,'Docks',G.dockPolygons.map(x=>polygonObject(x,'dock'))));
layers.push(layer(lid++,'Roads',G.roads.map(x=>polylineObject(x,'road'))));
layers.push(layer(lid++,'Road Nodes',(G.roadNodes??[]).map(x=>pointObject({...x,role:'road_node'},'road_node'))));
layers.push(layer(lid++,'Shorelines',G.shorelines.map(x=>polylineObject(x,'shoreline'))));
layers.push(layer(lid++,'Bridges',G.bridges.map(bridgeObject)));
layers.push(layer(lid++,'Landmarks',G.landmarks.map(x=>rectObject(x,'landmark'))));
layers.push(layer(lid++,'Decorations',G.decorations.map(x=>rectObject(x,'decoration'))));
layers.push(layer(lid++,'Sockets',G.sockets.map(x=>pointObject(x,'socket'))));

const map={
 type:'map',version:'1.10',tiledversion:'1.12.2',orientation:'orthogonal',renderorder:'right-down',infinite:true,
 width:0,height:0,tilewidth:32,tileheight:32,nextlayerid:lid,nextobjectid:nextObjectId,
 properties:[property('map_id',G.id),property('geography_version',G.version,'int'),property('encounter_owned_geometry',G.encounterOwnedGeometry),property('inspiration',G.inspiration),property('min_x',G.bounds.minX),property('max_x',G.bounds.maxX),property('min_y',G.bounds.minY),property('max_y',G.bounds.maxY)],
 layers,tilesets:[]
};
await mkdir(join(root,'dist/maps'),{recursive:true});
const out=join(root,'dist/maps/coastal-intercept.migration.tmj');
await writeFile(out,JSON.stringify(map,null,2)+'\n');
console.log(`Exported ${out}: ${layers.length} layers, ${nextObjectId-1} objects, geography v${G.version}.`);
