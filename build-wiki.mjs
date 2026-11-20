import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import { slugifyFilePath } from '@quartz-community/utils';
const source=process.env.KB_ADDR || 'content';
const output=process.env.WIKI_OUTPUT_DIR || 'public';
// The staging directory is derived only; the Markdown source remains unchanged.
const staging=fs.mkdtempSync(path.join(os.tmpdir(),'kb-wiki-input-'));
let malformed=0;
function stage(dir,relative=''){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules','.obsidian'].includes(item.name))continue;
  const file=path.join(dir,item.name),rel=path.join(relative,item.name),out=path.join(staging,rel);
  if(item.isDirectory()){fs.mkdirSync(out,{recursive:true});stage(file,rel);continue;}
  if(!item.isFile())continue;
  fs.mkdirSync(path.dirname(out),{recursive:true});
  if(!file.endsWith('.md')){fs.copyFileSync(file,out);continue;}
  let text=fs.readFileSync(file,'utf8');
  const block=text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if(block){
   try{const data=yaml.load(block[1],{schema:yaml.JSON_SCHEMA});if(data!==undefined && (!data || typeof data!=='object' || Array.isArray(data)))throw new Error('Expected metadata map');}
   catch{malformed++;const fence='`'.repeat(Math.max(3,...(block[0].match(/`+/g)||[]).map(v=>v.length+1)));text=fence+'text\n'+block[0]+'\n'+fence+'\n'+text.slice(block[0].length);}
  }
  fs.writeFileSync(out,text);
 }
}
try{
 stage(source);
 if(!fs.existsSync(path.join(staging,'index.md')))fs.writeFileSync(path.join(staging,'index.md'),'---\ntitle: Main page\n---\n');
 if(malformed)console.log(`Rendering ${malformed} malformed metadata blocks as text; source files unchanged.`);
 execFileSync(process.execPath,['quartz/bootstrap-cli.mjs','build','-d',staging,'-o',output,'--concurrency','2'],{stdio:'inherit',env:{...process.env,KB_WIKI_SOURCE_ROOT:fs.realpathSync(source)}});
}finally{fs.rmSync(staging,{recursive:true,force:true});}
const published=JSON.parse(fs.readFileSync(path.join(output,'static/contentIndex.json'),'utf8'));
const sources={};
function copy(dir) { for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
 const file=path.join(dir,item.name);
 if(item.isDirectory()){copy(file);continue;}
 if(!item.isFile() || !file.endsWith('.md'))continue;
 const slug=slugifyFilePath(path.relative(source,file).replaceAll(path.sep,'/'));
 if(!(slug in published))continue;
 sources[slug]=path.relative(source,file).replaceAll(path.sep,'/');
 const out=path.join(output,'source',slug+'.md');fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(file,out);
}}
copy(source);

fs.writeFileSync(path.join(output,'static/source-map.json'),JSON.stringify(sources));

const inventory={root:fs.realpathSync(source),files:Object.entries(sources).map(([slug,file])=>({slug,path:file,title:published[slug].title||path.basename(file)}))};
fs.writeFileSync(path.join(output,'static/wiki-files.json'),JSON.stringify(inventory));
if(fs.existsSync(path.join(output,'directory.html')))throw new Error('The directory route is reserved for KB folder navigation.');
const home=fs.readFileSync(path.join(output,'index.html'),'utf8');
// Legacy tree links redirect to the main page, preserving their anchor.
fs.writeFileSync(path.join(output,'directory.html'),home);

// Search contains actual articles, not the graph home or generated directory pages.
const searchable=Object.fromEntries(Object.entries(published).filter(([slug])=>slug!=='index' && Object.hasOwn(sources,slug)));
fs.writeFileSync(path.join(output,'static/contentIndex.json'),JSON.stringify(searchable));
