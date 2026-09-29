import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const map=JSON.parse(await readFile(new URL('../dist/maps/coastal-intercept.tmj',import.meta.url),'utf8'));
const layer=(name)=>map.layers.find(l=>l.name===name);
const prop=(obj,name,fallback=null)=>obj.properties?.find(p=>p.name===name)?.value??fallback;
const points=(obj,key)=>{const ox=obj.x??0,oy=obj.y??0;return (obj[key]??[]).map(p=>({x:p.x+ox,y:p.y+oy}));};

function pointInPolygon(x,y,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.y>y)!==(b.y>y)) && x < (b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x)inside=!inside;
 }
 return inside;
}
const polys=(name)=>layer(name).objects.map(o=>points(o,'polygon'));
const land=polys('Land'),water=polys('Water Cutouts'),concrete=polys('Concrete'),docks=polys('Docks'),maritime=polys('Maritime Structures');
function substrate(x,y){
 for(const p of docks)if(pointInPolygon(x,y,p))return 'dock';
 for(const p of maritime)if(pointInPolygon(x,y,p))return 'concrete';
 for(const p of water)if(pointInPolygon(x,y,p))return 'water';
 for(const p of concrete)if(pointInPolygon(x,y,p))return 'concrete';
 for(const p of land)if(pointInPolygon(x,y,p))return 'land';
 return 'water';
}
function inBridge(x,y){
 return layer('Bridges').objects.some(b=>x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height);
}

test('every road deck is physically supported or explicitly bridged',()=>{
 const bad=[];
 for(const road of layer('Roads').objects){
  const line=points(road,'polyline'),width=Number(prop(road,'width',50));
  for(let k=1;k<line.length;k++){
   const a=line[k-1],b=line[k],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
   const nx=-dy/len,ny=dx/len,steps=Math.max(1,Math.ceil(len/24));
   for(let i=0;i<=steps;i++){
    const t=i/steps,cx=a.x+dx*t,cy=a.y+dy*t;
    for(const off of [0,-width*.36,width*.36]){
     const x=cx+nx*off,y=cy+ny*off;
     if(substrate(x,y)==='water'&&!inBridge(x,y))bad.push({road:road.name,x:Math.round(x),y:Math.round(y)});
    }
   }
  }
 }
 assert.deepEqual(bad.slice(0,12),[],`unsupported road samples: ${JSON.stringify(bad.slice(0,12))}; total=${bad.length}`);
});

test('production geography no longer uses repeated coast/harbour mega-modules',()=>{
 const bad=layer('Landmarks').objects.filter(o=>['coast','harbour'].includes(prop(o,'kind'))).map(o=>o.name);
 assert.deepEqual(bad,[],'large repeated scenery modules must be decomposed into authored terrain/decorations');
});

test('roads form an explicit graph instead of an implicit Y-only path',()=>{
 const nodes=layer('Road Nodes');
 assert.ok(nodes,'Road Nodes layer must exist');
 assert.ok(nodes.objects.length>=6,'road graph needs meaningful junctions');
 const ids=new Set(nodes.objects.map(o=>o.name));
 for(const road of layer('Roads').objects){
  const from=prop(road,'from_node'),to=prop(road,'to_node');
  assert.ok(ids.has(from),`${road.name} missing valid from_node`);
  assert.ok(ids.has(to),`${road.name} missing valid to_node`);
 }
});

test('semantic sockets declare their district and explicit anchor identity',()=>{
 const districts=new Set(layer('Districts').objects.map(o=>o.name));
 for(const socket of layer('Sockets').objects){
  assert.ok(districts.has(prop(socket,'district')),`${socket.name} missing valid district`);
  assert.equal(prop(socket,'anchor_id'),socket.name,`${socket.name} anchor_id must remain stable`);
 }
});

test('compiled runtime exposes road graph and semantic socket metadata',async()=>{
 const {COASTAL_GEOGRAPHY}=await import('../dist/src/game/content/coastalGeography.js');
 assert.ok(COASTAL_GEOGRAPHY.roadNodes?.length>=6);
 assert.ok(COASTAL_GEOGRAPHY.roadGraph?.segments?.length>=6);
 assert.ok(COASTAL_GEOGRAPHY.sockets.every(s=>s.anchorId===s.id&&typeof s.district==='string'));
});
