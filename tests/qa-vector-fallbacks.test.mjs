import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {constants} from 'node:fs';

const environment=['land-tile','land-tropical','land-alpine','land-snow','asphalt-tile','concrete-tile','dock-metal-tile','foam-strip','palm','rock-cluster','container-stack','street-lamp','crate-pile','scenic-wreck','rocky-island','helipad-mark','warehouse-a','service-building','tank-small','utility-block'];
const level1=['civil-house','industrial-hall','crane','warship','radar','dam-face','fortress-terrace','citadel-gate','citadel-wing','citadel-tower','tunnel-mouth','harbour-office','fuel-tank','naval-bunker','fortress-wall','citadel-bunker','canyon-retaining-wall','citadel-mountain-shoulder','civil-boat','coastal-watchtower','dam-abutment','dam-canyon-shoulder','dam-service-gallery','fortress-buttress','fortress-snow-terrace','gateway-arch-support','gateway-cliff-bank','gateway-keep','gateway-terrace','harbour-ramp','marina-pier','quay-edge','service-yard'];

test('QA branch has every required vector fallback',async()=>{
 const files=['dist/art/modules/bridge-module.svg',...environment.map(n=>`dist/art/environment/${n}.svg`),...level1.map(n=>`dist/art/level1/${n}.svg`)];
 for(const file of files)await access(new URL('../'+file,import.meta.url),constants.R_OK);
 assert.equal(files.length,54);
});

test('QA runtime points at vector art',async()=>{
 const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');
 const env=await readFile(new URL('../dist/src/game/render/Environment.js',import.meta.url),'utf8');
 const art=await readFile(new URL('../dist/src/game/content/level1Art.js',import.meta.url),'utf8');
 assert.doesNotMatch(coastal,/art\/environment\/[a-z0-9-]+\.png/);
 assert.match(env,/bridge-module\.svg/);
 assert.match(art,/art\/level1\/\$\{name\}\.svg/);
});

test('QA entry points are present',async()=>{
 await access(new URL('../dist/qa.html',import.meta.url),constants.R_OK);
 await access(new URL('../index.html',import.meta.url),constants.R_OK);
 await access(new URL('../package.json',import.meta.url),constants.R_OK);
});
