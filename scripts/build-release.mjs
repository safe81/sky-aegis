// Reproducible offline manifest and asset hashes. No bundler or external packages.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
await import('./compile-geography.mjs');
const {COASTAL_GEOGRAPHY_DATA:COASTAL_GEOGRAPHY}=await import('../dist/src/game/content/coastalGeographyData.js');

const BUILD='1.6.0';
const root=fileURLToPath(new URL('../',import.meta.url));
async function files(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);out.push(...(e.isDirectory()?await files(p):[p]));}return out;}
const paths=(await files(join(root,'dist'))).map(p=>relative(join(root,'dist'),p).replaceAll('\\','/')).sort();
const core=['./',...paths.filter(p=>p!=='service-worker.js').map(p=>'./'+p)];
const source=`const CACHE='sky-aegis-shell-v${BUILD}';\nconst CORE=${JSON.stringify(core,null,2)};\n
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sky-aegis-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const key=event.request.mode==='navigate'?url.pathname:event.request;
  const cached=await cache.match(key,{ignoreSearch:true});if(cached)return cached;
  try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}
  catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}
 }));
});
`;
await writeFile(join(root,'dist/service-worker.js'),source);
const assets=[];
for(const p of paths.filter(p=>p.startsWith('art/')||p.startsWith('ui/')||p.startsWith('maps/'))){const b=await readFile(join(root,'dist',p));assets.push({path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
const counts={
 aircraft_bank_sprites:assets.filter(p=>p.path.startsWith('art/aircraft-banks/')).length,
 aircraft_hangar:9,aircraft_portraits:9,aircraft_wrecks:9,enemy_sprites:10,boss_assets:5,
 environment_modules:1,environment_modular_props:4,fireball_animation_frames:4,new_effect_textures:2,
 geography_master_maps:1,geography_districts:COASTAL_GEOGRAPHY.districts.length,
 geography_land_polygons:COASTAL_GEOGRAPHY.landPolygons.length,
 geography_water_cutouts:COASTAL_GEOGRAPHY.waterPolygons.length,
 geography_maritime_structures:COASTAL_GEOGRAPHY.maritimeStructures.length,
 geography_semantic_sockets:COASTAL_GEOGRAPHY.sockets.length,
 geography_road_nodes:COASTAL_GEOGRAPHY.roadNodes.length,geography_road_segments:COASTAL_GEOGRAPHY.roadGraph.segments.length,
 geography_reference_trace:COASTAL_GEOGRAPHY.referenceTrace.length,geography_atmosphere_zones:COASTAL_GEOGRAPHY.atmosphereZones.length,
 environment_biome_textures:3,
};
await writeFile(join(root,'ASSET_MANIFEST.json'),JSON.stringify({build:BUILD,counts,precache_entries:core.length,files:assets},null,2)+'\n');
console.log(`Generated cache v${BUILD}: ${core.length} entries; hashed ${assets.length} art/map files.`);
