import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import vm from 'node:vm';
const source=await readFile(new URL('../dist/service-worker.js',import.meta.url),'utf8');
test('offline worker installs every packaged resource and retires only older Sky Aegis caches',async()=>{
 const handlers={},deleted=[],stores=new Map();let installed=[],claimed=false,skip=false,offline=false;
 const caches={open:async id=>{if(!stores.has(id))stores.set(id,new Map());const store=stores.get(id);return {addAll:async urls=>{installed=urls;for(const u of urls)store.set(new URL(u,'https://game.test/').pathname,{url:u,ok:true});},match:async (u)=>store.get(new URL(typeof u==='string'?u:u.url,'https://game.test/').pathname),put:async()=>{}};},keys:async()=>['sky-aegis-shell-v1.0.0','unrelated-app',...stores.keys()],delete:async k=>{deleted.push(k);return true;}};
 const self={addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{skip=true;},clients:{claim:async()=>{claimed=true;}},location:{origin:'https://game.test'}};
 vm.runInNewContext(source,{self,caches,URL,fetch:async()=>{if(offline)throw Error('offline');return {ok:true,clone(){return this;}};}});
 let work;handlers.install({waitUntil:p=>work=p});await work;assert.ok(skip);assert.ok(installed.includes('./art/environment/warehouse-a.png'));assert.ok(installed.includes('./art/environment/service-building.png'));assert.ok(!installed.includes('./art/modules/harbour-module.png'));assert.ok(installed.includes('./src/game/enemies/EncounterPaths.js'));
 for(const p of installed.filter(p=>p!=='./'))await access(new URL('../dist/'+p.replace(/^\.\//,''),import.meta.url));
 handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['sky-aegis-shell-v1.0.0']);assert.ok(claimed);
 offline=true;handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://game.test/index.html'},respondWith:p=>work=p});assert.equal((await work).url,'./index.html');
 handlers.fetch({request:{method:'GET',mode:'cors',url:'https://game.test/src/game/render/CoastalScene.js'},respondWith:p=>work=p});assert.equal((await work).url,'./src/game/render/CoastalScene.js');
});
