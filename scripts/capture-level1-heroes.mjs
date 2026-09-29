import {spawn,spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const outDir=path.join(root,'verification/level1/runtime');
await mkdir(outDir,{recursive:true});

const chromium=['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].find(existsSync);
if(!chromium){console.error('CAPTURE_UNAVAILABLE: no Chromium/Chrome executable found');process.exit(20);}

const port=4387;
const server=spawn(process.execPath,['scripts/serve.mjs','dist',String(port)],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverText='';
server.stdout.on('data',d=>serverText+=d.toString());
server.stderr.on('data',d=>serverText+=d.toString());
await new Promise(r=>setTimeout(r,700));

const heroes={
 'bridge-gateway':['left','center','right'],
 'civil-harbour':['center'],
 'naval-yard':['left','center','right'],
 'lower-dam':['center'],
 'citadel-basin':['left','center','right'],
};
const results=[];
try{
 for(const [id,cameras] of Object.entries(heroes)){
  for(const camera of cameras){
   const file=path.join(outDir,`${id}-${camera}.png`);
   const url=`http://127.0.0.1:${port}/qa.html?checkpoint=${encodeURIComponent(id)}&checkpointMode=quiet&camera=${camera}&capture=1&w=720&h=1280&quality=high`;
   const args=['--headless=new','--no-sandbox','--disable-gpu-sandbox','--hide-scrollbars','--force-device-scale-factor=1.5','--window-size=720,1280',`--screenshot=${file}`,url];
   const run=spawnSync(chromium,args,{cwd:root,encoding:'utf8',timeout:30000});
   if(run.status!==0){
    console.error(`CAPTURE_UNAVAILABLE: ${id}/${camera} Chromium exited ${run.status}\n${run.stderr||run.stdout||''}`);
    process.exitCode=21;
    break;
   }
   results.push({id,camera,file,path:path.relative(root,file),url});
  }
  if(process.exitCode)break;
 }
 if(!process.exitCode){
  await writeFile(path.join(outDir,'capture-index.json'),JSON.stringify({capturedAt:new Date().toISOString(),chromium,results},null,2));
  console.log(JSON.stringify({status:'ok',count:results.length,outDir},null,2));
 }
} finally {
 server.kill('SIGTERM');
}
