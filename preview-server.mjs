import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import handler from 'serve-handler';
import {readDocument,saveDocument} from './document-store.mjs';
const source=process.env.KB_ADDR || 'content';
let building=false,dirty=false;
function rebuild(){
 dirty=true;if(building)return;dirty=false;building=true;
 const child=spawn(process.execPath,['build-wiki.mjs'],{stdio:'inherit'});
 child.on('error',e=>console.error(e));
 child.on('close',code=>{building=false;if(code)console.error(`Build failed: ${code}`);if(dirty)rebuild();});
}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
http.createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/wiki/api/document'){
  if(req.method==='GET'){json(res,200,{content:readDocument(source,'public',url.searchParams.get('slug')).content});return;}
  if(req.method!=='PUT'){json(res,405,{error:'Method not allowed.'});return;}
  const origin=req.headers.origin;
  if(!origin || new URL(origin).host!==req.headers.host || !req.headers['content-type']?.startsWith('application/json')){json(res,403,{error:'Same-origin JSON request required.'});return;}
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024){json(res,413,{error:'Article is too large.'});return;}chunks.push(chunk);}
  const body=JSON.parse(Buffer.concat(chunks).toString());
  if(typeof body.original!=='string' || typeof body.content!=='string'){json(res,400,{error:'Content is required.'});return;}
  saveDocument(source,'public',url.searchParams.get('slug'),body.original,body.content);
  json(res,200,{saved:true});rebuild();return;
 }
 if(req.url==='/'||req.url==='/wiki'){res.writeHead(302,{Location:'/wiki/'});res.end();return;}
 if(!req.url.startsWith('/wiki/')){res.writeHead(404);res.end();return;}
 const relative=decodeURIComponent(url.pathname.slice(6));
 const file=path.resolve('public',relative);
 if(file.startsWith(path.resolve('public')+path.sep) && fs.existsSync(file) && fs.statSync(file).isDirectory() && !url.pathname.endsWith('/')) {res.writeHead(302,{Location:url.pathname+'/'+url.search});res.end();return;}
 req.url=req.url.slice(5);
 await handler(req,res,{public:'public',cleanUrls:true});
 }catch(e){json(res,e.status||500,{error:e.status?e.message:'Could not read or save this article.'});}
}).listen(8788,'127.0.0.1',()=>console.log('http://localhost:8788/wiki/'));
