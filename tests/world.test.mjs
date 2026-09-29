import test from 'node:test';
import assert from 'node:assert/strict';
import { Environment } from '../dist/src/game/render/Environment.js';

test('environment anchors remain fixed relative to the continuous master geography through travel and hold',()=>{
 const env=Environment.build();
 assert.equal(env.map.encounterOwnedGeometry,false);
 assert.ok(env.map.landPolygons.length>=3);
 assert.ok(env.map.roads.length>=2);
 const socket=env.sockets[0];
 const a=env.socketAt(socket.id,1200),b=env.socketAt(socket.id,1323);
 assert.equal(b.y-a.y,123);
 assert.deepEqual(env.socketAt(socket.id,1323),b);
 assert.equal(a.x,b.x);
});

test('mission geography does not loop at the old 5200-unit boundary',()=>{
 const env=Environment.build();
 const atStart={land:env.visibleLand(0),atmosphere:env.visibleAtmosphere(0),district:env.districtAtWorldY(-500)?.id};
 const later={land:env.visibleLand(5200),atmosphere:env.visibleAtmosphere(5200),district:env.districtAtWorldY(-5700)?.id};
 assert.notEqual(atStart.district,later.district);
 assert.notDeepEqual(atStart.land,later.land);
 assert.notDeepEqual(atStart.atmosphere,later.atmosphere);
});
