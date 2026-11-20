(() => {
 if(window.__kbWikiDirectory)return;window.__kbWikiDirectory=true;
 let observers=[];
 const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
 function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function entryId(path){return `tree-${path||'.'}`;}
 function urlFor(browser,path){const url=new URL(browser,location.href);url.search='';url.hash=encodeURIComponent(entryId(path));return url.href;}
 function pathbar(nav,inventory,relative,isFolder,browser){
  nav.replaceChildren();
  const full=inventory.root+(relative?'/'+relative:'');nav.setAttribute('aria-label',`File path: ${full}`);
  const rootParts=inventory.root.split('/').filter(Boolean),parts=full.split('/').filter(Boolean);
  const track=element('div','wiki-path-track');const leading=element('span','wiki-path-leading','/');track.append(leading);
  const segments=parts.map((name,i)=>{
   const wrapper=element('span','wiki-path-segment');
   const folder=i>=rootParts.length-1;
   const label=element(folder?'a':'span','wiki-path-label',name);
   if(folder)label.href=urlFor(browser,parts.slice(rootParts.length,i+1).join('/'));
   if(i===parts.length-1)label.setAttribute('aria-current','page');
   wrapper.append(label);if(i<parts.length-1)wrapper.append(element('span','wiki-path-separator','/'));
   track.append(wrapper);return wrapper;
  });
  const omitted=element('button','wiki-path-ellipsis','…/');omitted.type='button';omitted.setAttribute('aria-label','Show hidden path segments');omitted.setAttribute('aria-expanded','false');
  const menu=element('div','wiki-path-menu');menu.hidden=true;nav.append(track,menu);
  const close=()=>{menu.hidden=true;omitted.setAttribute('aria-expanded','false');};
  omitted.onclick=()=>{menu.hidden=!menu.hidden;omitted.setAttribute('aria-expanded',String(!menu.hidden));};
  nav.addEventListener('focusout',event=>{if(!nav.contains(event.relatedTarget))close();});
  nav.addEventListener('keydown',event=>{if(event.key==='Escape'){close();omitted.focus();}});
  const fit=()=>{
   close();omitted.remove();menu.replaceChildren();segments.forEach(el=>el.hidden=false);
   track.classList.add('wiki-path-fitting');
   if(track.scrollWidth<=track.clientWidth+1){track.classList.remove('wiki-path-fitting');return;}
   let first=-1,last=-1;
   // Preserve the beginning and the filename, then as many nearby folders as fit.
   const middle=Math.max(1,Math.floor((segments.length-1)/2));
   for(let radius=0;radius<segments.length;radius++){
    for(const i of radius===0?[middle]:[middle-radius,middle+radius]){
     if(i<=0 || i>=segments.length-1)continue;
     segments[i].hidden=true;first=first<0?i:Math.min(first,i);last=Math.max(last,i);
     segments[first].before(omitted);
     if(track.scrollWidth<=track.clientWidth+1)break;
    }
    if(track.scrollWidth<=track.clientWidth+1)break;
   }
   track.classList.remove('wiki-path-fitting');
   if(first>=0){
    for(let i=first;i<=last;i++){
     const link=segments[i].querySelector('.wiki-path-label').cloneNode(true);link.removeAttribute('aria-current');menu.append(link);
    }
   }
  };
  const observer=new ResizeObserver(fit);observer.observe(track);observers.push(observer);fit();
 }
 function highlight(){
  const tree=document.querySelector('.wiki-directory-tree');if(!tree)return;
  tree.querySelectorAll('.wiki-tree-target').forEach(row=>row.classList.remove('wiki-tree-target'));
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const row=id && document.getElementById(id);if(!row || !tree.contains(row))return;
  row.classList.add('wiki-tree-target');
  requestAnimationFrame(()=>{if(row.isConnected)row.scrollIntoView({block:'center',behavior:'instant'});});
 }
 function directory(main,inventory,browser){
  const legacy=new URL(location.href).searchParams.get('path');
  if(legacy!==null)history.replaceState(history.state,'',urlFor(browser,legacy));
  const title=inventory.root.split('/').pop();
  main.querySelector('.article-title').textContent=title;
  pathbar(main.querySelector('.wiki-path'),inventory,'',true,browser);
  const root=new URL('./',new URL(browser,location.href));
  const tree=main.querySelector('.wiki-directory-tree');tree.replaceChildren();
  const branches=new Map([['',[]]]);
  const seen=new Set(['']);
  for(const file of inventory.files){
   const parts=file.path.split('/');parts.pop();let parent='';
   for(const name of parts){
    const at=parent?parent+'/'+name:name;
    if(!seen.has(at)){seen.add(at);branches.set(at,[]);branches.get(parent).push({path:at,name,folder:true});}
    parent=at;
   }
   branches.get(parent).push({...file,name:file.path.split('/').pop(),folder:false});
  }
  for(const children of branches.values())children.sort((a,b)=>Number(b.folder)-Number(a.folder)||collator.compare(a.name,b.name));
  function addRow(entry,ancestors,last){
   const row=element('div','wiki-tree-row');row.id=entryId(entry.path);
   if(ancestors!==null){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    const width=(ancestors.length+1)*20;svg.setAttribute('viewBox',`0 0 ${width} 30`);svg.setAttribute('width',String(width));svg.setAttribute('height','30');svg.setAttribute('aria-hidden','true');svg.classList.add('wiki-tree-lines');
    const lines=ancestors.flatMap((continued,i)=>continued?[`M${i*20+9} 0v30`]:[]);
    const x=ancestors.length*20+9;lines.push(`M${x} 0v${last?15:30} M${x} 15h11`);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',lines.join(' '));svg.append(path);row.append(svg);
   }
   const link=element('a','wiki-tree-label',entry.name+(entry.folder?'/':''));
   link.href=entry.folder?urlFor(browser,entry.path):new URL(entry.slug==='index'?'':entry.slug,root).href;
   row.append(link);tree.append(row);
  }
  addRow({path:'',name:title,folder:true},null,true);
  function walk(at,ancestors){
   const children=branches.get(at)||[];
   children.forEach((entry,i)=>{const last=i===children.length-1;addRow(entry,ancestors,last);if(entry.folder)walk(entry.path,[...ancestors,!last]);});
  }
  walk('',[]);highlight();
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('.wiki-directory-tree a');
  if(link && new URL(link.href).pathname===location.pathname)requestAnimationFrame(highlight);
 });
 window.addEventListener('hashchange',highlight);
 async function init(){
  // Previously shared tree links keep their target on the combined main page.
  if(/\/directory(?:\.html)?\/?$/.test(location.pathname)){
   const home=new URL('./',location.href);
   const previous=new URL(location.href).searchParams.get('path');
   home.hash=previous!==null?encodeURIComponent(entryId(previous)):location.hash;
   location.replace(home.href);return;
  }
  observers.forEach(o=>o.disconnect());observers=[];
  const main=document.querySelector('[data-directory]'),nav=document.querySelector('.wiki-path[data-files]');
  const target=main||nav;if(!target)return;
  try{
   const response=await fetch(target.dataset.files,{cache:'no-store'});if(!response.ok)throw new Error('Could not load file paths.');
   const inventory=await response.json();if(!target.isConnected)return;
   if(main)directory(main,inventory,main.dataset.browser);
   else{const file=inventory.files.find(f=>f.slug===nav.dataset.slug);if(file)pathbar(nav,inventory,file.path,false,nav.dataset.browser);}
  }catch(error){target.append(element('p','',error.message));}
 }
 document.addEventListener('nav',init);document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();
})();
