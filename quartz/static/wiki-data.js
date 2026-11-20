const fetchData = fetch(new URL('contentIndex.json', document.currentScript.src))
  .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); });
window.quartzStaticUrl = new URL('./', document.currentScript.src).href;
