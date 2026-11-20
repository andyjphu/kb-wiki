import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function readDocument(source, output, slug) {
 const map=JSON.parse(fs.readFileSync(path.join(output,'static/source-map.json'),'utf8'));
 const relative=Object.hasOwn(map,slug) ? map[slug] : null;
 if(typeof relative!=='string' || !relative.endsWith('.md') || path.isAbsolute(relative) || relative.split(/[\\/]/).some(p=>p==='..')) throw Object.assign(new Error('Article not found.'),{status:404});
 const root=fs.realpathSync(source),file=fs.realpathSync(path.join(root,relative));
 if(!file.startsWith(root+path.sep)) throw Object.assign(new Error('Article not found.'),{status:404});
 return {file,content:fs.readFileSync(file,'utf8')};
}
export function saveDocument(source,output,slug,original,content) {
 // Synchronous compare-and-replace is serialized by the Node event loop.
 const doc=readDocument(source,output,slug);
 if(doc.content!==original) throw Object.assign(new Error('This article changed on disk. Copy the edits before reloading.'),{status:409});
 const temp=path.join(path.dirname(doc.file),`.wiki-${randomUUID()}.tmp`);
 try {fs.writeFileSync(temp,content,{mode:fs.statSync(doc.file).mode & 0o777,flag:'wx'});fs.renameSync(temp,doc.file);}finally{fs.rmSync(temp,{force:true});}
}
