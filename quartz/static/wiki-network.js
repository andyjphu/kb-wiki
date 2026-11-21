(() => {
 if(window.__kbWikiNetwork)return;window.__kbWikiNetwork=true;
 const library=new URL('vendor/d3-7.9.0.min.js',document.currentScript.src).href;
 let loading,cleanup=()=>{};
 const indexes=new Map();
 function content(url){if(!indexes.has(url))indexes.set(url,fetch(url).then(response=>{if(!response.ok)throw new Error("Could not load network.");return response.json();}));return indexes.get(url);}
 function load(){
  if(window.d3)return Promise.resolve(window.d3);
  return loading ||= new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=library;script.onload=()=>resolve(window.d3);script.onerror=()=>reject(new Error('Could not load network.'));document.head.append(script);});
 }
 async function render(){
  cleanup();const host=document.querySelector('.wiki-network');if(!host)return;
  let disposed=false,simulation,observer;cleanup=()=>{disposed=true;simulation?.stop();observer?.disconnect();};
  try{
   const [d3,index]=await Promise.all([load(),content(host.dataset.index)]);
   if(disposed || !host.isConnected)return;
   const nodes=(host.wikiFiles||[]).map(file=>({id:file.slug,title:index[file.slug]?.title||file.title||file.name,path:file.path}));
   const ids=new Set(nodes.map(n=>n.id));const seen=new Set(),links=[];
   for(const node of nodes)for(const target of index[node.id]?.links||[]){
    if(!ids.has(target) || target===node.id)continue;
    const key=[node.id,target].sort().join('\0');if(seen.has(key))continue;seen.add(key);links.push({source:node.id,target});
   }
   if(!nodes.length){host.textContent='Expand a folder to show its files.';return;}
   const canvas=document.createElementNS('http://www.w3.org/2000/svg','svg');canvas.classList.add('wiki-network-svg');canvas.setAttribute('aria-label','Knowledge network');canvas.setAttribute('role','group');host.replaceChildren(canvas);
   const width=host.clientWidth,height=host.clientHeight;
   const svg=d3.select(host.querySelector('svg'));svg.selectAll('*').remove();svg.attr('viewBox',`0 0 ${width} ${height}`);
   const drawing=svg.append('g');
   const edges=drawing.append('g').selectAll('line').data(links).join('line').attr('class','wiki-network-link');
   const items=drawing.append('g').selectAll('a').data(nodes).join('a').attr('class','wiki-network-node').attr('href',n=>new URL(host.dataset.root+n.id,location.href).href).attr('aria-label',n=>n.title).attr('data-slug',n=>n.id).attr('data-router-ignore','').on('click',(event,n)=>{if(event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;event.preventDefault();event.stopPropagation();document.dispatchEvent(new CustomEvent('wiki-select-file',{detail:{slug:n.id}}));});
   items.append('circle').attr('r',7);items.append('text').text(n=>n.title).attr('x',12).attr('y',5);
   const tick=()=>{edges.attr('x1',l=>l.source.x).attr('y1',l=>l.source.y).attr('x2',l=>l.target.x).attr('y2',l=>l.target.y);items.attr('transform',n=>`translate(${n.x},${n.y})`);};
   simulation=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(n=>n.id).distance(160)).force('charge',d3.forceManyBody().strength(-700)).force('center',d3.forceCenter(width/2-60,height/2)).force('x',d3.forceX(width/2).strength(.03)).force('y',d3.forceY(height/2).strength(.03)).force('collision',d3.forceCollide(65));
   simulation.stop();for(let i=0;i<180;i++)simulation.tick();tick();simulation.on('tick',tick);
   const zoom=d3.zoom().scaleExtent([.05,4]).on('zoom',event=>drawing.attr('transform',event.transform));
   svg.call(zoom).on('dblclick.zoom',null);
   const fit=()=>{
    const w=host.clientWidth,h=host.clientHeight;
    svg.attr('viewBox',`0 0 ${w} ${h}`);
    const bounds=drawing.node().getBBox();
    const scale=Math.min(1.5,(w-48)/Math.max(bounds.width,1),(h-48)/Math.max(bounds.height,1));
    svg.call(zoom.transform,d3.zoomIdentity.translate((w-bounds.width*scale)/2-bounds.x*scale,(h-bounds.height*scale)/2-bounds.y*scale).scale(scale));
   };
   fit();
   items.call(d3.drag().clickDistance(5).on('start',(event,n)=>{if(!event.active)simulation.alphaTarget(.15).restart();n.fx=n.x;n.fy=n.y;}).on('drag',(event,n)=>{n.fx=event.x;n.fy=event.y;}).on('end',(event,n)=>{if(!event.active)simulation.alphaTarget(0);n.fx=null;n.fy=null;}));
   let lastWidth=width,lastHeight=height;
   observer=new ResizeObserver(()=>{if(lastWidth===host.clientWidth && lastHeight===host.clientHeight)return;lastWidth=host.clientWidth;lastHeight=host.clientHeight;fit();});observer.observe(host);
  }catch(error){if(!disposed && host.isConnected)host.textContent=error.message;}
 }
 document.addEventListener('wiki-network-update',render);document.addEventListener('wiki-network-clear',()=>cleanup());
 document.addEventListener('nav',()=>{indexes.clear();render();});document.addEventListener('prenav',()=>cleanup());
 document.addEventListener('DOMContentLoaded',render);if(document.readyState!=='loading')render();
})();
