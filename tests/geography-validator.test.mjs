import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateTiledGeography} from '../scripts/lib/geography-validator.mjs';

const map=JSON.parse(await readFile(new URL('../dist/maps/coastal-intercept.tmj',import.meta.url),'utf8'));

test('validator accepts the authored production map',()=>{
 const result=validateTiledGeography(map);
 assert.equal(result.ok,true,result.errors.join('\n'));
 assert.deepEqual(result.errors,[]);
});

test('validator rejects an unsupported road crossing water',()=>{
 const broken=structuredClone(map);
 const roads=broken.layers.find(l=>l.name==='Roads');
 const road=roads.objects.find(o=>o.name==='coastal-spine');
 road.polyline.splice(8,0,{x:950,y:-5000});
 const result=validateTiledGeography(broken);
 assert.equal(result.ok,false);
 assert.ok(result.errors.some(e=>e.includes('coastal-spine')&&e.includes('unsupported')));
});

test('validator rejects invalid road graph references and socket districts',()=>{
 const broken=structuredClone(map);
 const roads=broken.layers.find(l=>l.name==='Roads');
 roads.objects[0].properties.find(p=>p.name==='from_node').value='does-not-exist';
 const sockets=broken.layers.find(l=>l.name==='Sockets');
 sockets.objects[0].properties.find(p=>p.name==='district').value='wrong-district';
 const result=validateTiledGeography(broken);
 assert.equal(result.ok,false);
 assert.ok(result.errors.some(e=>e.includes('from_node')));
 assert.ok(result.errors.some(e=>e.includes('district')));
});

test('validator rejects malformed visual recovery zones',()=>{
 const broken=structuredClone(map);
 const relief=broken.layers.find(l=>l.name==='Relief Zones');
 assert.ok(relief,'Relief Zones layer is required for the recovery pass');
 relief.objects[0].polygon=[{x:0,y:0},{x:10,y:0}];
 const result=validateTiledGeography(broken);
 assert.equal(result.ok,false);
 assert.ok(result.errors.some(e=>e.includes('Relief zone')&&e.includes('polygon')));
});
