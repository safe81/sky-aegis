import test from 'node:test';
import assert from 'node:assert/strict';
import {COASTAL_GEOGRAPHY_DATA as map} from '../dist/src/game/content/coastalGeographyData.js';

let space=null;
try{space=await import('../dist/src/game/content/level1Space.js');}catch{}

test('level 1 exposes an explicit portrait-composition blueprint registration',()=>{
 assert.ok(space,'level1Space.js must exist');
 assert.deepEqual(Object.keys(map.referenceRegistration??{}).sort(),['height','originX','originY','projection','scaleX','scaleY','sourceScale','width']);
 const {LEVEL1_SPACE,blueprintToWorld,worldToBlueprint}=space;
 assert.equal(LEVEL1_SPACE.width,682);
 assert.equal(LEVEL1_SPACE.height,2048);
 assert.equal(LEVEL1_SPACE.projection,'portrait-composition-x-compression');
 const p=blueprintToWorld(100,100);
 const px=blueprintToWorld(200,100);
 const py=blueprintToWorld(100,200);
 assert.ok(px.x>p.x&&py.y>p.y,'registration must preserve source direction');
 assert.ok(LEVEL1_SPACE.scaleX<LEVEL1_SPACE.scaleY,'runtime projection intentionally compresses X so portrait landmarks fit the camera');
 const corner=worldToBlueprint(map.bounds.maxX,map.bounds.maxY);
 assert.ok(Math.abs(corner.u-LEVEL1_SPACE.width)<1e-8);
 assert.ok(Math.abs(corner.v-LEVEL1_SPACE.height)<1e-8);
});

test('runtime map uses the 900-unit portrait composition while retaining lateral camera travel',()=>{
 assert.ok(map.referenceRegistration);
 const worldW=map.bounds.maxX-map.bounds.minX;
 assert.equal(worldW,900);
 assert.ok(worldW>720,'world must remain wider than the portrait viewport');
 assert.ok(worldW<720*2,'camera should see both banks/landmarks instead of a tiny crop of a 2600-unit map');
});

test('scroll limits keep both map ends reachable without exposing outside geography',()=>{
 assert.ok(space,'level1Space.js must exist');
 const limits=space.scrollLimits(0,1280,map.bounds);
 assert.equal(-limits.max,map.bounds.minY);
 assert.ok(limits.min<=limits.max);
 const bottom=space.scrollForBlueprintRow(2048,1280,0);
 assert.ok(Number.isFinite(bottom));
});

test('gameplay and horizontal camera use the compiled authored world width',async()=>{
 const constants=await import('../dist/src/game/constants.js');
 const camera=await import('../dist/src/game/camera/HorizontalCamera.js');
 const authoredWidth=map.bounds.maxX-map.bounds.minX;
 assert.ok(Math.abs(constants.PLAYFIELD_WIDTH-authoredWidth)<1e-8);
 assert.equal(camera.initialCameraX(map.bounds.minX),0);
 assert.ok(Math.abs(camera.initialCameraX(map.bounds.maxX)-(authoredWidth-constants.VIEWPORT_WIDTH))<1e-8);
});