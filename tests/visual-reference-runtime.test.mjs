import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const coastal=await readFile(new URL('../dist/src/game/render/CoastalScene.js',import.meta.url),'utf8');
const forbidden=/level1-master-visual\.png|LEVEL1_BLUEPRINT\.png|LEVEL1_MASTER_REFERENCE\.png/i;

async function walk(dir){
 const files=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())files.push(...await walk(path));
  else files.push(path);
 }
 return files;
}

test('production neither packages nor requests the blueprint picture',async()=>{
 for(const path of await walk(dist)){
  assert.doesNotMatch(path,forbidden);
  if(/\.(js|json|tmj|html|css|webmanifest)$/.test(path)){
   assert.doesNotMatch(await readFile(path,'utf8'),forbidden,path);
  }
 }
 assert.doesNotMatch(coastal,/drawMasterReference/);
});

test('constructed renderer keeps live water, shoreline motion and atmosphere',()=>{
 assert.match(coastal,/WaterSurface/);
 assert.match(coastal,/drawAnimatedShoreFoam|ShoreEffects/);
 assert.match(coastal,/drawCloudLayer|Atmosphere/);
 assert.match(coastal,/drawDamSpray/);
});
