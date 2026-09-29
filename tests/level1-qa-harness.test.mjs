import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const checkpoints=JSON.parse(await readFile(new URL('../dist/qa/level1-checkpoints.json',import.meta.url),'utf8').catch(()=>Buffer.from('[]')));
const qa=await readFile(new URL('../dist/src/qa.js',import.meta.url),'utf8');

test('Level 1 QA exposes all fifteen registered review checkpoints',()=>{
 const expected=['open-sea','outer-archipelago','dense-archipelago','coastal-narrows','bridge-gateway','civil-harbour','industrial-harbour','naval-yard','mountain-transition','river-canyon','lower-dam','alpine-reservoir','frozen-valley','fortress-approach','citadel-basin'];
 assert.deepEqual(checkpoints.map(c=>c.id),expected);
 for(const c of checkpoints){
  assert.ok(Number.isFinite(c.sourceCenter?.u)&&Number.isFinite(c.sourceCenter?.v));
  assert.ok(c.sourceReviewBounds?.right>c.sourceReviewBounds?.left&&c.sourceReviewBounds?.bottom>c.sourceReviewBounds?.top);
  assert.ok(Number.isFinite(c.screenFocusY)&&Number.isFinite(c.cameraFocusU)&&Number.isFinite(c.animationTime));
  assert.ok(c.seed!==undefined&&Array.isArray(c.requiredFeatureIds)&&c.requiredFeatureIds.length>0);
 }
});

test('QA harness exposes deterministic checkpoint selection and capture metadata',()=>{
 assert.match(qa,/window\.__LEVEL1_QA__/);
 assert.match(qa,/selectCheckpoint/);
 assert.match(qa,/sample/);
 assert.match(qa,/scrollForBlueprintRow/);
 assert.match(qa,/backingWidth/);
 assert.match(qa,/visibleFeatureIds/);
 assert.match(qa,/visualRevision/);
 assert.match(qa,/params\.get\('checkpoint'\)/);
});

test('reference contract and trace inventory are packaged outside runtime dist',async()=>{
 await access(new URL('../docs/reference/level1-trace-inventory.json',import.meta.url));
 await access(new URL('../docs/reference/level1-visual-contract.md',import.meta.url));
});
