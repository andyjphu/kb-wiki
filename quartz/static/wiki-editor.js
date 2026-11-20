(() => {
 if(window.__kbWikiEditor)return;window.__kbWikiEditor=true;
 let dirty=false;
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 document.addEventListener('click',async event=>{
  const button=event.target.closest?.('.wiki-edit');if(!button || button.disabled)return;
  button.disabled=true;
  const main=button.closest('main'),article=main.querySelector('article');
  if(!article){button.disabled=false;return;}
  const form=document.createElement('form');form.className='wiki-editor';
  form.innerHTML='<textarea aria-label="Markdown" spellcheck="false" disabled></textarea><div class="wiki-editor-actions"><button type="submit" disabled>Save</button><button type="button" class="wiki-cancel">Cancel</button><span role="status">Loading…</span></div>';
  article.hidden=true;article.after(form);
  const input=form.querySelector('textarea'),save=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');
  const api=new URL(button.dataset.api,location.href);api.searchParams.set('slug',button.dataset.slug);
  let original='',saving=false;
  const close=()=>{dirty=false;form.remove();article.hidden=false;button.disabled=false;};
  form.querySelector('.wiki-cancel').onclick=()=>{if(!saving)close();};
  input.oninput=()=>{dirty=input.value!==original;};
  try{
   const response=await fetch(api,{cache:'no-store'}),data=await response.json();
   if(!response.ok)throw new Error(data.error||'Could not load article.');
   if(!form.isConnected)return;
   original=data.content;input.value=original;input.disabled=false;save.disabled=false;status.textContent='';input.focus();
  }catch(error){status.textContent=error.message;status.className='wiki-editor-error';}
  form.onsubmit=async event=>{
   event.preventDefault();if(saving || input.disabled)return;saving=true;save.disabled=true;input.disabled=true;
   const cancel=form.querySelector('.wiki-cancel');cancel.disabled=true;status.className='';status.textContent='Saving…';
   try{
    const content=input.value;
    const response=await fetch(api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({original,content})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not save article.');
    original=content;dirty=false;status.textContent='Saved. Updating…';
    // Disk is already updated. Wait only for the derived HTML generation.
    for(let attempt=0;attempt<60;attempt++){
     await new Promise(resolve=>setTimeout(resolve,1000));
     if(!form.isConnected)return;
     const source=await fetch(button.dataset.source,{cache:'no-store'});
     if(!source.ok || await source.text()!==content)continue;
     const rendered=await fetch(location.href,{cache:'no-store'});if(!rendered.ok)continue;
     const next=new DOMParser().parseFromString(await rendered.text(),'text/html');
     const nextMain=next.querySelector('#wiki-main');if(!nextMain)continue;
     main.replaceWith(nextMain);
     for(const selector of ['.wiki-navigation','.wiki-appearance']){
      const old=document.querySelector(selector),replacement=next.querySelector(selector);if(old && replacement)old.replaceWith(replacement);
     }
     document.title=next.title;
     document.dispatchEvent(new CustomEvent('nav',{detail:{url:button.dataset.slug}}));
     return;
    }
    status.textContent='Saved. Rendering is taking longer; refresh to check.';
   }catch(error){status.textContent=error.message;status.className='wiki-editor-error';}
   finally{saving=false;save.disabled=false;input.disabled=false;cancel.disabled=false;}
  };
 });
})();
