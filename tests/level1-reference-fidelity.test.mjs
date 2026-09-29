import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const map=JSON.parse(await readFile(new URL('../dist/maps/coastal-intercept.tmj',import.meta.url),'utf8'));
const p=(name)=>map.properties.find(x=>x.name===name)?.value;
const scale=Number(p('reference_scale'));
const originX=Number(p('reference_origin_x'));
const originY=Number(p('reference_origin_y'));
const layer=(name)=>map.layers.find(x=>x.name===name);
const worldPoints=(o,key='polygon')=>(o[key]??[]).map(pt=>({x:(o.x??0)+pt.x,y:(o.y??0)+pt.y}));
const toSource=({x,y})=>({u:(x-originX)/scale,v:(y-originY)/scale});
const area=(pts)=>Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p.u*q.v-q.u*p.v;},0))/2;

function sourceMetrics(o){
 const pts=worldPoints(o).map(toSource),us=pts.map(p=>p.u),vs=pts.map(p=>p.v);
 return {pts,minU:Math.min(...us),maxU:Math.max(...us),minV:Math.min(...vs),maxV:Math.max(...vs),area:area(pts)};
}

test('archipelago silhouettes occupy the same broad source region as the blueprint rather than thin placeholder strips',()=>{
 const islands=layer('Land').objects.filter(o=>o.name.startsWith('archipelago-island-'));
 assert.ok(islands.length>=15,'the blueprint contains many individually readable island silhouettes');
 const metrics=islands.map(sourceMetrics);
 assert.ok(Math.min(...metrics.map(m=>m.minV))<=1380,'dense archipelago must begin near the lower bridge/island transition in the source');
 assert.ok(Math.max(...metrics.map(m=>m.maxV))>=1950,'outer archipelago must continue into the open-sea end of the source');
 assert.ok(metrics.filter(m=>m.area>=3000).length>=4,'at least four large reference islands must retain substantial projected area');
 assert.ok(metrics.filter(m=>(m.maxV-m.minV)>=70).length>=4,'large islands must have real vertical mass, not repeated narrow ellipses');
});

test('every traced archipelago island has a shoreline using the same silhouette',()=>{
 const islands=layer('Land').objects.filter(o=>o.name.startsWith('archipelago-island-'));
 const shores=new Map(layer('Shorelines').objects.map(o=>[o.name,o]));
 for(const island of islands){
  const shore=shores.get(`${island.name}-shore`);
  assert.ok(shore,`missing shoreline for ${island.name}`);
  const a=worldPoints(island),b=worldPoints(shore,'polyline');
  assert.equal(b.length,a.length+1,`${island.name} shoreline should close the traced polygon exactly`);
  for(let i=0;i<a.length;i++){
   assert.ok(Math.hypot(a[i].x-b[i].x,a[i].y-b[i].y)<1e-6,`${island.name} shoreline diverges from land silhouette`);
  }
  assert.ok(Math.hypot(a[0].x-b.at(-1).x,a[0].y-b.at(-1).y)<1e-6,`${island.name} shoreline is not closed`);
 }
});

test('major Level 1 landmarks are registered inside their blueprint review windows',()=>{
 const named=new Map(layer('Landmarks').objects.map(o=>[o.name,o]));
 const bridge=layer('Bridges').objects.find(o=>o.name==='narrows-bridge');
 const centerV=(o)=>toSource({x:(o.x??0)+(o.width??0)/2,y:(o.y??0)+(o.height??0)/2}).v;
 const checks=[
  ['gateway bridge',bridge,1030,1210],
  ['civil harbour',named.get('civil-harbour-core'),890,1050],
  ['industrial harbour',named.get('industrial-terminal-core'),790,940],
  ['naval yard',named.get('naval-yard-core'),620,825],
  ['lower dam',named.get('dam-landmark'),275,420],
  ['citadel',named.get('citadel-core'),0,150],
 ];
 for(const [label,o,min,max] of checks){
  assert.ok(o,`missing ${label}`);
  const v=centerV(o);
  assert.ok(v>=min&&v<=max,`${label} source row ${v.toFixed(1)} is outside ${min}-${max}`);
 }
});

test('district bands follow traced blueprint transitions rather than equal world-length slices',()=>{
 const expected={
  'open-sea':1974,'outer-archipelago':1790,'dense-archipelago':1510,'coastal-narrows':1275,
  'bridge-gateway':1120,'civil-harbour':970,'industrial-harbour':865,'naval-yard':722,
  'mountain-transition':602,'river-canyon':482,'lower-dam':348,'alpine-reservoir':268,
  'frozen-valley':205,'fortress-approach':142,'citadel-basin':75,
 };
 for(const d of layer('Districts').objects){
  const props=Object.fromEntries((d.properties??[]).map(p=>[p.name,p.value]));
  const centerWorld=(Number(props.min_y)+Number(props.max_y))/2;
  const centerV=(centerWorld-originY)/scale;
  assert.ok(Math.abs(centerV-expected[d.name])<=65,`${d.name} source center ${centerV.toFixed(1)} is not aligned to the blueprint journey`);
 }
});

test('dam and final fortress artwork occupy their blueprint silhouettes without extending beyond the source',()=>{
 const arts=new Map(layer('Art Instances').objects.map(o=>[o.name,o]));
 const extentV=(id)=>{
  const o=arts.get(id);assert.ok(o,`missing art instance ${id}`);
  const props=Object.fromEntries((o.properties??[]).map(p=>[p.name,p.value]));
  const bottom=(o.y-originY)/scale;
  const top=(o.y-Number(props.visual_height)-originY)/scale;
  return {top,bottom};
 };
 const within=(id,topMin,topMax,bottomMin,bottomMax)=>{
  const e=extentV(id);
  assert.ok(e.top>=topMin&&e.top<=topMax,`${id} top row ${e.top.toFixed(1)} outside ${topMin}-${topMax}`);
  assert.ok(e.bottom>=bottomMin&&e.bottom<=bottomMax,`${id} bottom row ${e.bottom.toFixed(1)} outside ${bottomMin}-${bottomMax}`);
 };
 within('dam-face-main',250,300,400,425);
 within('fortress-terrace-west',105,135,170,195);
 within('fortress-terrace-east',105,135,170,195);
 within('citadel-wing-west',50,90,130,160);
 within('citadel-wing-east',50,90,130,160);
 within('citadel-gate-main',15,60,130,160);
 within('citadel-tower-west',65,100,130,160);
 within('citadel-tower-east',65,100,130,160);
 within('citadel-radar-main',0,25,50,80);
});

test('mainland banks and through-roads do not invade the open/outer archipelago',()=>{
 const land=layer('Land').objects;
 for(const id of ['west-coastal-bank','east-coastal-bank']){
  const m=sourceMetrics(land.find(o=>o.name===id));
  assert.ok(m.maxV<=1400,`${id} extends to source row ${m.maxV.toFixed(1)}; the lower archipelago must remain open water plus islands`);
 }
 const roadLayer=layer('Roads');
 for(const id of ['coastal-spine','east-port-road']){
  const o=roadLayer.objects.find(x=>x.name===id);assert.ok(o,`missing ${id}`);
  const pts=worldPoints(o,'polyline').map(toSource);
  const maxV=Math.max(...pts.map(p=>p.v));
  assert.ok(maxV<=1400,`${id} extends to source row ${maxV.toFixed(1)} through the outer archipelago`);
 }
});
