import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('v12 shoreline shelves remain broad and subdued',async()=>{
 const shore=await readFile(new URL('../dist/src/game/render/ShoreEffects.js',import.meta.url),'utf8');
 assert.match(shore,/drawShallowShelf\(/);
 assert.match(shore,/beach\?88:64/);
 assert.match(shore,/rgba\(156,220,211,\.22\)/);
 assert.doesNotMatch(shore,/rgba\(244,255,251,\.72\)/);
});
