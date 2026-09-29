import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const map=JSON.parse(await readFile(new URL('../dist/maps/coastal-intercept.tmj',import.meta.url),'utf8'));
const layer=name=>map.layers.find(l=>l.name===name);
const pts=o=>(o.polygon??[]).map(p=>({x:(o.x??0)+p.x,y:(o.y??0)+p.y}));
function inside(x,y,p){let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
 const a=p[i],b=p[j];if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x)v=!v;
}return v;}
const lands=layer('Land').objects.map(pts),water=layer('Water Cutouts').objects.map(pts);
const sx=Number(map.properties.find(p=>p.name==='max_x')?.value??1152)/1152;
const naturalLand=(x,y)=>!water.some(p=>inside(x,y,p))&&lands.some(p=>inside(x,y,p));
function supportRatio(name){
 const o=layer('Concrete').objects.find(o=>o.name===name);assert.ok(o,`missing ${name}`);const p=pts(o);
 const xs=p.map(q=>q.x),ys=p.map(q=>q.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 let total=0,supported=0;
 for(let iy=0;iy<36;iy++)for(let ix=0;ix<28;ix++){
  const x=minX+(maxX-minX)*(ix+.5)/28,y=minY+(maxY-minY)*(iy+.5)/36;
  if(!inside(x,y,p))continue;total++;if(naturalLand(x,y))supported++;
 }
 return supported/Math.max(1,total);
}

test('major harbour aprons are integrated with the landmass instead of floating concrete strips',()=>{
 for(const id of ['outer-harbour-apron','cargo-terminal','naval-yard-apron']){
  assert.ok(supportRatio(id)>=0.55,`${id} needs >=55% natural/reclaimed land support; got ${(supportRatio(id)*100).toFixed(1)}%`);
 }
});

test('narrows fortress is built on a real island under the concrete works',()=>{
 assert.ok(supportRatio('narrows-fort-island')>=0.55,`fort island concrete needs a natural island base; got ${(supportRatio('narrows-fort-island')*100).toFixed(1)}%`);
});

test('major port districts form real basins between opposing connected banks',()=>{
 const substrate=(x,y)=>{
  const inWater=water.some(p=>inside(x,y,p));
  if(inWater)return 'water';
  return lands.some(p=>inside(x,y,p))?'land':'water';
 };
 for(const [label,y,left,channel,right] of [
  ['civil harbour',-1525,150*sx,576*sx,1000*sx],
  ['industrial harbour',-2075,130*sx,576*sx,1015*sx],
  ['naval yard',-2600,150*sx,576*sx,1000*sx],
 ]){
  assert.equal(substrate(left,y),'land',`${label}: west bank missing`);
  assert.equal(substrate(channel,y),'water',`${label}: navigable basin/channel missing`);
  assert.equal(substrate(right,y),'land',`${label}: east bank/peninsula missing`);
 }
});
