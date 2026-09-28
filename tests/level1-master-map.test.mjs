import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const map=JSON.parse(await readFile(new URL('../dist/maps/coastal-intercept.tmj',import.meta.url),'utf8'));
const layer=name=>map.layers.find(l=>l.name===name);
const prop=(obj,name,fallback=null)=>obj.properties?.find(p=>p.name===name)?.value??fallback;

const expected=[
 'open-sea','outer-archipelago','dense-archipelago','coastal-narrows','bridge-gateway',
 'civil-harbour','industrial-harbour','naval-yard','mountain-transition','river-canyon',
 'lower-dam','alpine-reservoir','frozen-valley','fortress-approach','citadel-basin',
];

test('level 1 follows the approved fifteen-district reference journey',()=>{
 assert.deepEqual(layer('Districts').objects.map(o=>o.name),expected);
 assert.equal(map.properties.find(p=>p.name==='geography_version')?.value,10);
 const biomes=layer('Districts').objects.map(o=>prop(o,'biome'));
 assert.deepEqual(biomes.slice(0,4),['tropical-ocean','tropical-islands','tropical-islands','temperate-coast']);
 assert.ok(biomes.includes('alpine'));
 assert.ok(biomes.slice(-3).every(x=>x==='snow'));
});

test('reference trace explicitly defines one continuous water spine and both banks',()=>{
 const trace=layer('Reference Trace');
 assert.ok(trace,'Reference Trace layer is required');
 for(const id of ['water-spine','west-reference-bank','east-reference-bank']){
  const o=trace.objects.find(x=>x.name===id);assert.ok(o,`missing ${id}`);assert.ok(o.polyline.length>=15,`${id} needs detailed control points`);
 }
});

test('map expands the approved reference instead of collapsing it to one background image',()=>{
 assert.ok(layer('Land').objects.length>=20,'archipelago and banks must be authored geometry');
 assert.ok(layer('Decorations').objects.length>=70,'level needs local environmental detail');
 assert.ok(layer('Docks').objects.length>=8,'harbour needs multiple independent piers');
 assert.ok(layer('Maritime Structures').objects.some(o=>prop(o,'kind')==='dam'),'reference dam must be real map geometry');
 assert.ok(layer('Concrete').objects.some(o=>o.name==='citadel-platform'),'final fortress needs authored platform geometry');
});

test('terrain declares tropical, alpine and snow material families',()=>{
 const materials=new Set(layer('Land').objects.map(o=>prop(o,'material')));
 for(const material of ['land-tropical','land-alpine','land-snow'])assert.ok(materials.has(material),`missing ${material}`);
});

test('atmosphere zones author cloud density and fog progression',()=>{
 const atmosphere=layer('Atmosphere Zones');assert.ok(atmosphere);
 assert.ok(atmosphere.objects.length>=6);
 const densities=atmosphere.objects.map(o=>Number(prop(o,'cloud_density',0)));
 assert.ok(Math.max(...densities)>=0.7);
 assert.ok(atmosphere.objects.some(o=>prop(o,'kind')==='snow-clouds'));
});

test('mission scroll traverses the compressed visual-reference map before final boss',async()=>{
 const source=await readFile(new URL('../dist/src/game/missions/MissionDirector.js',import.meta.url),'utf8');
 assert.match(source,/LEVEL1_SCROLL_SPEED\s*=\s*35/);
 assert.match(source,/this\.lastScrollDelta=LEVEL1_SCROLL_SPEED\*dt/);
});

test('main canyon and snow shorelines are authored at gameplay-detail density',()=>{
 const shore=layer('Shorelines').objects;
 for(const id of ['mainland-west-shore','mainland-east-shore']){
  const line=shore.find(o=>o.name===id);assert.ok(line,id);
  assert.ok((line.polyline?.length??0)>=80,`${id} needs enough control points to avoid long straight corridor walls`);
 }
});