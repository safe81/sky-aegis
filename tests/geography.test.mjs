import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COASTAL_GEOGRAPHY,
  districtAtWorldY,
  surfaceAtWorldPoint,
  socketByRole,
  roadPointNearWorldY,
} from '../dist/src/game/content/coastalGeography.js';
import {blueprintToWorld} from '../dist/src/game/content/level1Space.js';

function unique(items){return new Set(items).size===items.length;}

function distancePointToSegment(px,py,ax,ay,bx,by){
  const abx=bx-ax,aby=by-ay,apx=px-ax,apy=py-ay;
  const denom=abx*abx+aby*aby||1;
  const t=Math.max(0,Math.min(1,(apx*abx+apy*aby)/denom));
  return Math.hypot(px-(ax+abx*t),py-(ay+aby*t));
}

function pointNearPolyline(p,line,tolerance){
  for(let i=1;i<line.points.length;i++){
    const a=line.points[i-1],b=line.points[i];
    if(distancePointToSegment(p.x,p.y,a.x,a.y,b.x,b.y)<=tolerance)return true;
  }
  return false;
}

test('coastal geography is one authored world, not encounter-owned scenery',()=>{
  assert.equal(COASTAL_GEOGRAPHY.id,'coastal-intercept-master');
  assert.ok(COASTAL_GEOGRAPHY.bounds.minY < -6000);
  assert.ok(COASTAL_GEOGRAPHY.landPolygons.length>=3);
  assert.ok(COASTAL_GEOGRAPHY.roads.length>=2);
  assert.ok(COASTAL_GEOGRAPHY.districts.length>=8);
  assert.ok(COASTAL_GEOGRAPHY.landmarks.length>=8);
  assert.equal(COASTAL_GEOGRAPHY.encounterOwnedGeometry,false);
});

test('mainland shoreline and coastal road are continuous from south to north',()=>{
  const shore=COASTAL_GEOGRAPHY.shorelines.find(x=>x.id==='mainland-west-shore');
  const road=COASTAL_GEOGRAPHY.roads.find(x=>x.id==='coastal-spine');
  assert.ok(shore.points.length>=24);
  assert.ok(road.points.length>=24);
  for(const line of [shore,road]){
    for(let i=1;i<line.points.length;i++){
      assert.ok(line.points[i].y < line.points[i-1].y,`${line.id} must progress monotonically north`);
      assert.ok(Math.hypot(line.points[i].x-line.points[i-1].x,line.points[i].y-line.points[i-1].y)<1300,`${line.id} contains a geographic jump`);
    }
  }
});

test('districts form an ordered geographic journey',()=>{
  const expected=['open-sea','outer-archipelago','dense-archipelago','coastal-narrows','bridge-gateway','civil-harbour','industrial-harbour','naval-yard','mountain-transition','river-canyon','lower-dam','alpine-reservoir','frozen-valley','fortress-approach','citadel-basin'];
  assert.deepEqual(COASTAL_GEOGRAPHY.districts.map(d=>d.id),expected);
  for(let i=1;i<COASTAL_GEOGRAPHY.districts.length;i++){
    assert.equal(COASTAL_GEOGRAPHY.districts[i-1].minY,COASTAL_GEOGRAPHY.districts[i].maxY);
  }
  assert.equal(districtAtWorldY(blueprintToWorld(0,1974).y)?.id,'open-sea');
  assert.equal(districtAtWorldY(blueprintToWorld(0,970).y)?.id,'civil-harbour');
  assert.equal(districtAtWorldY(blueprintToWorld(0,348).y)?.id,'lower-dam');
  assert.equal(districtAtWorldY(blueprintToWorld(0,75).y)?.id,'citadel-basin');
});

test('bridge placement connects actual road approaches on both banks',()=>{
  const bridge=COASTAL_GEOGRAPHY.bridges.find(b=>b.id==='narrows-bridge');
  assert.ok(bridge);
  assert.equal(bridge.connects[0],'coastal-spine');
  assert.equal(bridge.connects[1],'east-port-road');
  const westRoad=COASTAL_GEOGRAPHY.roads.find(r=>r.id===bridge.connects[0]);
  const eastRoad=COASTAL_GEOGRAPHY.roads.find(r=>r.id===bridge.connects[1]);
  assert.ok(pointNearPolyline(bridge.a,westRoad,95));
  assert.ok(pointNearPolyline(bridge.b,eastRoad,95));
  assert.ok(['road','bridge'].includes(surfaceAtWorldPoint(bridge.a.x,bridge.a.y)));
  assert.ok(['road','bridge'].includes(surfaceAtWorldPoint(bridge.b.x,bridge.b.y))); // deck legitimately overrides the road where they overlap
});

test('semantic sockets have unique ids and physically valid surfaces',()=>{
  const sockets=COASTAL_GEOGRAPHY.sockets;
  assert.ok(sockets.length>=30);
  assert.ok(unique(sockets.map(s=>s.id)));
  const allowed={
    road_vehicle:new Set(['road','bridge']),
    aa_pad:new Set(['land','concrete','road']),
    missile_pad:new Set(['land','concrete','road']),
    dock:new Set(['concrete','dock']),
    rescue_zone:new Set(['concrete','dock','land']),
    water_lane:new Set(['water']),
    boss_anchor:new Set(['water']),
    boss_zone:new Set(['water','land','concrete','road','dock','bridge']),
    prop_pad:new Set(['land','concrete','road','dock']),
  };
  for(const s of sockets){
    const surface=surfaceAtWorldPoint(s.x,s.y);
    assert.ok(allowed[s.role]?.has(surface),`${s.id} (${s.role}) invalid on ${surface}`);
  }
  for(const role of Object.keys(allowed))assert.ok(socketByRole(role).length>0,`missing ${role}`);
});

test('road lookup returns a real point on the continuous coastal road',()=>{
  for(const y of [blueprintToWorld(0,1320).y,blueprintToWorld(0,1100).y,blueprintToWorld(0,850).y,blueprintToWorld(0,550).y,blueprintToWorld(0,200).y]){
    const p=roadPointNearWorldY('coastal-spine',y);
    assert.ok(p);
    assert.ok(Math.abs(p.y-y)<700);
    assert.ok(['road','bridge'].includes(surfaceAtWorldPoint(p.x,p.y)),'road route may legitimately cross an authored bridge deck');
  }
});

test('coastline has authored coves/headlands instead of parallel corridor walls',()=>{
  const shore=COASTAL_GEOGRAPHY.shorelines.find(x=>x.id==='mainland-west-shore');
  const xs=shore.points.map(p=>p.x);
  assert.ok(Math.max(...xs)-Math.min(...xs)>=180,'main coastline must materially change lateral position');
  const right=COASTAL_GEOGRAPHY.shorelines.find(x=>x.id==='mainland-east-shore');
  const widths=shore.points.map((p,i)=>Math.abs((right.points[i]?.x??right.points.at(-1).x)-p.x));
  assert.ok(Math.max(...widths)-Math.min(...widths)>=300,'reference channel must visibly widen and narrow across the mission');
  assert.ok((COASTAL_GEOGRAPHY.waterPolygons??[]).length>=3,'harbour basins/inlets must be real water cutouts');
  const ids=new Set((COASTAL_GEOGRAPHY.waterPolygons??[]).map(x=>x.id));
  assert.ok(ids.has('civil-marina-west'));
  assert.ok(ids.has('industrial-basin-west'));
  assert.ok(ids.has('naval-dry-dock-water'));
});

test('port geography uses attached breakwaters and reclaimed terminals rather than an east wall',()=>{
  const breakwaters=(COASTAL_GEOGRAPHY.maritimeStructures??[]).filter(x=>x.kind==='breakwater');
  assert.ok(breakwaters.length>=2,'port mouth needs paired authored breakwaters');
  for(const b of breakwaters)assert.ok(b.points.length>=4);
  const west=breakwaters.find(b=>b.id==='west-breakwater'),east=breakwaters.find(b=>b.id==='east-breakwater');
  assert.ok(west&&east,'paired harbour breakwaters required');
  const sx=(COASTAL_GEOGRAPHY.bounds.maxX-COASTAL_GEOGRAPHY.bounds.minX)/1152;
  assert.ok(Math.min(...west.points.map(p=>p.x))<300*sx&&Math.max(...west.points.map(p=>p.x))>400*sx,'west breakwater must project from west bank into channel');
  assert.ok(Math.max(...east.points.map(p=>p.x))>850*sx&&Math.min(...east.points.map(p=>p.x))<760*sx,'east breakwater must project from east bank into channel');
  const longEastBanks=COASTAL_GEOGRAPHY.landPolygons.filter(poly=>{
    const ys=poly.points.map(p=>p.y), xs=poly.points.map(p=>p.x);
    return Math.max(...ys)-Math.min(...ys)>1250 && Math.min(...xs)>700*((COASTAL_GEOGRAPHY.bounds.maxX-COASTAL_GEOGRAPHY.bounds.minX)/1152);
  });
  assert.ok(longEastBanks.length>=1,'the approved fjord reference requires a real opposing eastern bank');
});
