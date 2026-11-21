(() => {
 if(window.__kbWikiDirectory)return;window.__kbWikiDirectory=true;
 let observers=[];
 let initialization=0;
 let selectTarget=()=>{};
 let previewRequest;
 let selectFile=()=>{};
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
 function directory(main,inventory,browser){
  const legacy=new URL(location.href).searchParams.get('path');
  if(legacy!==null)history.replaceState(history.state,'',urlFor(browser,legacy));
  const title=inventory.root.split('/').pop();
  main.querySelector('.article-title').textContent=title;
  pathbar(main.querySelector('.wiki-path'),inventory,'',true,browser);
  const root=new URL('./',new URL(browser,location.href));
  const tree=main.querySelector('.wiki-directory-tree');
  const preview=main.closest('.wiki-home-layout').querySelector('.wiki-file-preview');
  const branches=new Map([['',[]]]),entries=new Map();
  const expanded=new Set(['']);let selected=null,previewSlug,mode='graph';
  let visibleFiles=[];
  for(const file of inventory.files){
   const parts=file.path.split('/');parts.pop();let parent='';
   for(const name of parts){
    const at=parent?parent+'/'+name:name;
    if(!branches.has(at)){const entry={path:at,name,folder:true};branches.set(at,[]);entries.set(at,entry);branches.get(parent).push(entry);}
    parent=at;
   }
   const entry={...file,name:file.path.split('/').pop(),folder:false};
   branches.get(parent).push(entry);entries.set(entry.path,entry);
  }
  for(const children of branches.values())children.sort((a,b)=>Number(b.folder)-Number(a.folder)||collator.compare(a.name,b.name));
  function updateGraph(){
   const host=preview.querySelector('.wiki-network');if(!host)return;
   host.wikiFiles=visibleFiles;document.dispatchEvent(new Event('wiki-network-update'));
  }
  function showGraph(){
   mode='graph';previewSlug=undefined;previewRequest?.abort();
   if(!preview.querySelector('.wiki-network')){
    const host=element('div','wiki-network');host.dataset.index=new URL('static/contentIndex.json',root).href;host.dataset.root=root.href;
    host.setAttribute('aria-label','Knowledge network');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('wiki-network-svg');svg.setAttribute('aria-label','Knowledge network');svg.setAttribute('role','group');host.append(svg);preview.replaceChildren(host);
   }
   updateGraph();
  }
  async function showPreview(entry){
   if(previewSlug===entry.slug)return;previewSlug=entry.slug;mode='article';
   document.dispatchEvent(new Event('wiki-network-clear'));
   previewRequest?.abort();const request=new AbortController();previewRequest=request;
   const url=new URL(entry.slug==='index'?'':entry.slug,root);
   const header=element('div','wiki-file-preview-header');
   header.append(element('span','wiki-file-preview-title',entry.title||entry.name));
   const open=element('a','wiki-file-preview-open','Open page ↗');open.href=url.href;open.target='_blank';open.rel='noopener';open.dataset.routerIgnore='';header.append(open);
   const body=element('div','wiki-file-preview-body');body.append(element('p','','Loading…'));preview.replaceChildren(header,body);
   try{
    const response=await fetch(url,{signal:request.signal});if(!response.ok)throw new Error('Could not load this page.');
    const page=new DOMParser().parseFromString(await response.text(),'text/html');
    if(request.signal.aborted || !preview.isConnected)return;
    const article=page.querySelector('#wiki-main > article') || page.querySelector('.wiki-home-source')?.content.querySelector('article');
    if(!article)throw new Error('No article preview available.');
    article.querySelectorAll('a[role="anchor"]').forEach(anchor=>anchor.remove());
    // Relative article links and images must resolve against the article, not the tree.
    article.querySelectorAll('[href],[src],[srcset]').forEach(el=>{
     for(const attribute of ['href','src'])if(el.hasAttribute(attribute)){
      const value=el.getAttribute(attribute);if(value)el.setAttribute(attribute,new URL(value,url).href);
     }
     if(el.hasAttribute('srcset'))el.removeAttribute('srcset');
    });
    article.querySelectorAll('a').forEach(link=>{link.target='_blank';link.rel='noopener';link.dataset.routerIgnore='';});
    body.replaceChildren(article);body.scrollTop=0;
   }catch(error){if(error.name!=='AbortError')body.replaceChildren(element('p','',error.message));}
  }
  function addRow(entry,ancestors,last){
   const row=element('div','wiki-tree-row');row.id=entryId(entry.path);
   if(entry.path===selected)row.classList.add('wiki-tree-target');
   if(ancestors!==null){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    const width=(ancestors.length+1)*20;svg.setAttribute('viewBox',`0 0 ${width} 30`);svg.setAttribute('width',String(width));svg.setAttribute('height','30');svg.setAttribute('aria-hidden','true');svg.classList.add('wiki-tree-lines');
    const lines=ancestors.flatMap((continued,i)=>continued?[`M${i*20+9} 0v30`]:[]);
    const x=ancestors.length*20+9;lines.push(`M${x} 0v${last?15:30} M${x} 15h11`);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',lines.join(' '));svg.append(path);row.append(svg);
   }
   const label=element(entry.folder?'button':'a','wiki-tree-label',entry.name+(entry.folder?(expanded.has(entry.path)?'/':'\\'):''));
   if(entry.folder){
    label.type='button';label.setAttribute('aria-expanded',String(expanded.has(entry.path)));
    label.onclick=event=>{
     if(event.shiftKey){
      for(const folder of branches.keys())if(entry.path==='' || folder===entry.path || folder.startsWith(entry.path+'/'))expanded.add(folder);
     }else expanded.has(entry.path)?expanded.delete(entry.path):expanded.add(entry.path);
     draw();document.getElementById(entryId(entry.path))?.querySelector('button')?.focus({preventScroll:true});
    };
   }else{
    label.href=urlFor(browser,entry.path);
    label.onclick=event=>{
     if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
     event.preventDefault();event.stopPropagation();history.pushState(history.state,'',label.href);selected=entry.path;draw();showPreview(entry);
    };
   }
   if(!entry.folder){label.classList.add('wiki-tree-file');visibleFiles.push(entry);}
   row.append(label);tree.append(row);
  }
  function draw(){
   visibleFiles=[];tree.replaceChildren();addRow({path:'',name:title,folder:true},null,true);
   function walk(at,ancestors){
    if(!expanded.has(at))return;
    const children=branches.get(at)||[];
    children.forEach((entry,i)=>{const last=i===children.length-1;addRow(entry,ancestors,last);if(entry.folder)walk(entry.path,[...ancestors,!last]);});
   }
   walk('',[]);if(mode==='graph')updateGraph();
  }
  selectTarget=()=>{
   let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
   selected=id.startsWith('tree-')?id.slice(5):null;if(selected==='.')selected='';
   const entry=entries.get(selected);
   if(entry){
    const parts=selected.split('/');if(!entry.folder)parts.pop();
    for(let i=1;i<=parts.length;i++)expanded.add(parts.slice(0,i).join('/'));
    expanded.add('');
   }
   draw();if(entry && !entry.folder)showPreview(entry);else showGraph();
   if(id)requestAnimationFrame(()=>{const row=document.getElementById(entryId(selected));if(row?.isConnected)row.scrollIntoView({block:'center',behavior:'instant'});});
  };
  selectFile=slug=>{
   const entry=visibleFiles.find(file=>file.slug===slug);if(!entry)return;
   history.pushState(history.state,'',urlFor(browser,entry.path));selected=entry.path;draw();showPreview(entry);
  };
  main.closest('#wiki-main').onclick=event=>{
   if(event.defaultPrevented || event.target.closest('a,button,input,textarea,select,[contenteditable],.wiki-network') || window.getSelection()?.toString())return;
   selected=null;history.replaceState(history.state,'',root.href);mode='graph';draw();showGraph();
  };
  selectTarget();
 }
 document.addEventListener('wiki-select-file',event=>selectFile(event.detail.slug));
 window.addEventListener('hashchange',()=>selectTarget());
 window.addEventListener('popstate',()=>selectTarget());
 async function init(){
  const generation=++initialization;
  // Previously shared tree links keep their target on the combined main page.
  if(/\/directory(?:\.html)?\/?$/.test(location.pathname)){
   const home=new URL('./',location.href);
   const previous=new URL(location.href).searchParams.get('path');
   home.hash=previous!==null?encodeURIComponent(entryId(previous)):location.hash;
   location.replace(home.href);return;
  }
  observers.forEach(o=>o.disconnect());observers=[];previewRequest?.abort();selectTarget=()=>{};selectFile=()=>{};
  const main=document.querySelector('[data-directory]'),nav=document.querySelector('.wiki-path[data-files]');
  const target=main||nav;if(!target)return;
  try{
   const response=await fetch(target.dataset.files,{cache:'no-store'});if(!response.ok)throw new Error('Could not load file paths.');
   const inventory=await response.json();if(generation!==initialization || !target.isConnected)return;
   if(main)directory(main,inventory,main.dataset.browser);
   else{const file=inventory.files.find(f=>f.slug===nav.dataset.slug);if(file)pathbar(nav,inventory,file.path,false,nav.dataset.browser);}
  }catch(error){target.append(element('p','',error.message));}
 }
 document.addEventListener('nav',init);document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();
})();
