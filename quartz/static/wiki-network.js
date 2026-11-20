(() => {
 if(window.__kbWikiNetwork)return;window.__kbWikiNetwork=true;
 const library=new URL('vendor/d3-7.9.0.min.js',document.currentScript.src).href;
 let loading,cleanup=()=>{};
 function load(){
  if(window.d3)return Promise.resolve(window.d3);
  return loading ||= new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=library;script.onload=()=>resolve(window.d3);script.onerror=()=>reject(new Error('Could not load network.'));document.head.append(script);});
 }
 async function render(){
  cleanup();const host=document.querySelector('.wiki-network');if(!host)return;
  let disposed=false,simulation,observer;cleanup=()=>{disposed=true;simulation?.stop();observer?.disconnect();};
  try{
   const [d3,response,sources]=await Promise.all([load(),fetch(host.dataset.index,{cache:'no-store'}),fetch(new URL('source-map.json',new URL(host.dataset.index,location.href)),{cache:'no-store'}).then(r=>r.json())]);
   if(!response.ok)throw new Error('Could not load network.');
   const index=await response.json();if(disposed || !host.isConnected)return;
   const nodes=Object.entries(index).filter(([slug])=>slug!=='index' && Object.hasOwn(sources,slug)).map(([id,page])=>({id,title:page.title||id}));
   const ids=new Set(nodes.map(n=>n.id));const seen=new Set(),links=[];
   for(const node of nodes)for(const target of index[node.id].links||[]){
    if(!ids.has(target) || target===node.id)continue;
    const key=[node.id,target].sort().join('\0');if(seen.has(key))continue;seen.add(key);links.push({source:node.id,target});
   }
   if(!nodes.length){host.textContent='No pages yet.';return;}
   const width=host.clientWidth,height=host.clientHeight;
   const svg=d3.select(host.querySelector('svg'));svg.selectAll('*').remove();svg.attr('viewBox',`0 0 ${width} ${height}`);
   const drawing=svg.append('g');
   const edges=drawing.append('g').selectAll('line').data(links).join('line').attr('class','wiki-network-link');
   const items=drawing.append('g').selectAll('a').data(nodes).join('a').attr('class','wiki-network-node').attr('href',n=>new URL(host.dataset.root+n.id,location.href).href).attr('aria-label',n=>n.title);
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
 document.addEventListener('nav',render);document.addEventListener('prenav',()=>cleanup());
 document.addEventListener('DOMContentLoaded',render);if(document.readyState!=='loading')render();
})();
