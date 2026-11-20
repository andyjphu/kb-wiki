// Boid starts one builder; complete generations are published atomically.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import chokidar from 'chokidar';
const source=process.env.KB_ADDR, root=process.env.WIKI_OUTPUT_ROOT;
if(!source || !root) throw new Error('KB_ADDR and WIKI_OUTPUT_ROOT are required.');
fs.mkdirSync(root,{recursive:true,mode:0o700});
let running=null,dirty=false,timer,stopping=false;
const watcher=chokidar.watch(source,{ignoreInitial:true,ignored:p=>/(^|[/\\])(\.git|node_modules|\.obsidian)([/\\]|$)/.test(p),awaitWriteFinish:{stabilityThreshold:400,pollInterval:100}});
function schedule(){dirty=true;clearTimeout(timer);timer=setTimeout(build,400);}
function build(){
 if(stopping || running || !dirty)return;
 dirty=false;
 const output=fs.mkdtempSync(path.join(root,'build-'));
 const child=spawn(process.execPath,['build-wiki.mjs'],{cwd:import.meta.dirname,env:{...process.env,WIKI_OUTPUT_DIR:output},stdio:'inherit',detached:true});running=child;
 child.on('error',error=>{fs.writeFileSync(path.join(root,'error.txt'),error.message);});
 child.on('close',code=>{
  running=null;
  if(code===0 && !stopping){
   const link=path.join(root,'current');let old;try{old=fs.readlinkSync(link);}catch{}
   const temp=path.join(root,`current-${process.pid}`);fs.symlinkSync(output,temp);fs.renameSync(temp,link);fs.rmSync(path.join(root,'error.txt'),{force:true});
   // Keep one previous generation for requests already resolving an asset.
   for(const name of fs.readdirSync(root)){const candidate=path.join(root,name);if(name.startsWith('build-') && candidate!==output && candidate!==old)fs.rmSync(candidate,{recursive:true,force:true});}
  }else{fs.rmSync(output,{recursive:true,force:true});fs.writeFileSync(path.join(root,'error.txt'),`Wiki build failed (exit ${code}). See wiki-builder.log.`);}
  if(stopping)process.exit(0);if(dirty)build();
 });
}
watcher.on('all',schedule);
watcher.on('error',e=>console.error('Wiki watcher:',e));
function stop(){stopping=true;clearTimeout(timer);watcher.close();if(running){try{process.kill(-running.pid,'SIGTERM');}catch{running.kill('SIGTERM');}}else process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
dirty=true;build();
