import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root=resolve(process.argv[2]||'dist');
const requestedPort=Math.max(1,Math.min(65535,Number(process.argv[3])||4173));
const MAX_PORT_ATTEMPTS=20;
const shouldOpen=process.argv.includes('--open');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.wav':'audio/wav'};

function openBrowser(url){
  const spec=process.platform==='win32'?['cmd',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
  const child=spawn(spec[0],spec[1],{detached:true,stdio:'ignore'});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();
}

const server=createServer(async(req,res)=>{
  try{
    const raw=new URL(req.url||'/',`http://${req.headers.host||'127.0.0.1'}`).pathname;
    const relative=decodeURIComponent(raw).replace(/^\/+/, '');
    let file=resolve(root,relative||'index.html');
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
    let info;try{info=await stat(file);}catch{info=null;}
    if(info?.isDirectory())file=resolve(file,'index.html');
    if(!info||(!info.isFile()&&extname(file)!=='.html')){
      if(!extname(relative))file=resolve(root,'index.html');
    }
    const body=await readFile(file);
    const type=mime[extname(file)]||'application/octet-stream';
    const noCache=['.html','.js','.css','.webmanifest'].includes(extname(file));
    res.writeHead(200,{'Content-Type':type,'Cache-Control':noCache?'no-cache':'public, max-age=3600','Cross-Origin-Resource-Policy':'same-origin'});res.end(body);
  }catch(error){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end(`Not found\n${error instanceof Error?error.message:String(error)}`);}
});
let activePort=requestedPort;
let portAttempts=0;

function listen(){
  server.listen(activePort,'127.0.0.1');
}

server.on('error',error=>{
  if(error?.code==='EADDRINUSE' && portAttempts < MAX_PORT_ATTEMPTS && activePort < 65535){
    const occupied=activePort;
    activePort+=1;
    portAttempts+=1;
    console.log(`Port ${occupied} is already in use. Trying ${activePort}...`);
    setImmediate(listen);
    return;
  }
  console.error(`Unable to start Sky Aegis server: ${error.message}`);
  process.exitCode=1;
});
server.on('listening',()=>{
  const url=`http://127.0.0.1:${activePort}/`;
  console.log(`Sky Aegis running at ${url}`);
  console.log('Keep this window open while playing. Press Ctrl+C to stop.');
  if(shouldOpen)openBrowser(url);
});
listen();
