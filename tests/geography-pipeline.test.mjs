import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('../dist/src/game/content/coastalGeography.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
const tmj=JSON.parse(await readFile(new URL('../dist/maps/coastal-intercept.tmj',import.meta.url),'utf8'));

test('Tiled map is the authored source of truth for runtime geography',()=>{
 assert.match(runtime,/coastalGeographyData\.js/);
 assert.match(build,/compile-geography\.mjs/);
 assert.ok(tmj.layers.some(l=>l.name==='Water Cutouts'));
 assert.ok(tmj.layers.some(l=>l.name==='Maritime Structures'));
 assert.equal(tmj.properties.find(p=>p.name==='geography_version')?.value,10);
 assert.ok(tmj.layers.some(l=>l.name==='Reference Trace'));
 assert.ok(tmj.layers.some(l=>l.name==='Atmosphere Zones'));
 assert.ok(tmj.layers.some(l=>l.name==='Water Regions'));
 assert.ok(tmj.layers.some(l=>l.name==='Art Instances'));
 const rp=Object.fromEntries(tmj.properties.filter(p=>p.name.startsWith('reference_')).map(p=>[p.name,p.value]));
 assert.equal(rp.reference_width,682);assert.equal(rp.reference_height,2048);assert.ok(rp.reference_scale>0);
});

test('runtime-to-Tiled export is migration-only and cannot overwrite the authored source',async()=>{
 const source=await readFile(new URL('../scripts/export-geography.mjs',import.meta.url),'utf8');
 assert.match(source,/--migration-only/);
 assert.match(source,/coastal-intercept\.migration\.tmj/);
 assert.doesNotMatch(source,/const out=join\(root,'dist\/maps\/coastal-intercept\.tmj'\)/);
});
