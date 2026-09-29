import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.wav':'audio/wav','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://terminal.local').pathname; const file=resolve(root,decodeURIComponent(p.slice(1))||'index.html');if(!file.startsWith(root+sep))throw Error('outside root');const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
server.listen(4173,'0.0.0.0',()=>console.log('Local: http://localhost:4173/'));
