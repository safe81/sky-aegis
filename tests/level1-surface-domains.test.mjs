import test from 'node:test';
import assert from 'node:assert/strict';
import {COASTAL_GEOGRAPHY} from '../dist/src/game/content/coastalGeography.js';
import * as geography from '../dist/src/game/content/coastalGeography.js';

function centerBridge(id){
 const b=COASTAL_GEOGRAPHY.bridges.find(x=>x.id===id);assert.ok(b,id);
 return {b,x:b.x+b.width/2,y:b.y+b.height/2};
}

test('compiled geography exposes authored water regions and shoreline contact metadata',()=>{
 assert.ok(Array.isArray(COASTAL_GEOGRAPHY.waterRegions)&&COASTAL_GEOGRAPHY.waterRegions.length>=2,'Water Regions must be compiled');
 const bodies=new Set(COASTAL_GEOGRAPHY.waterRegions.map(r=>r.bodyId));
 assert.ok(bodies.has('coastal-river'));
 assert.ok(bodies.has('alpine-reservoir'));
 assert.ok(COASTAL_GEOGRAPHY.shorelines.every(s=>s.districtId&&s.contactKind&&s.waterSide&&Number.isFinite(s.height)));
});

test('bridge deck is ground support while clear span remains naval water',()=>{
 assert.equal(typeof geography.surfaceAtWorldPoint,'function');
 const {b,x,y}=centerBridge('narrows-bridge');
 assert.equal(geography.surfaceAtWorldPoint(x,y,'ground'),'bridge');
 assert.equal(geography.surfaceAtWorldPoint(x,y,'naval'),'water');
 const towerX=b.x+b.width*.17;
 assert.equal(geography.surfaceAtWorldPoint(towerX,y,'naval'),'obstacle');
});

test('dam separates lower water from the alpine reservoir',()=>{
 assert.equal(typeof geography.waterBodyAtWorldPoint,'function');
 const dam=COASTAL_GEOGRAPHY.maritimeStructures.find(x=>x.kind==='dam');assert.ok(dam);
 const xs=dam.points.map(p=>p.x),ys=dam.points.map(p=>p.y);
 const x=(Math.min(...xs)+Math.max(...xs))/2;
 const minY=Math.min(...ys),maxY=Math.max(...ys),midY=(minY+maxY)/2;
 assert.equal(geography.surfaceAtWorldPoint(x,midY,'naval'),'obstacle');
 assert.equal(geography.waterBodyAtWorldPoint(x,maxY+120),'coastal-river');
 assert.equal(geography.waterBodyAtWorldPoint(x,minY-120),'alpine-reservoir');
});
