(() => {
  if (window.__kbWikiControls) return;
  window.__kbWikiControls = true;
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  function get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
  function apply() {
    const text = get('wiki-text', 'standard');
    const width = get('wiki-width', 'standard');
    const color = get('wiki-color', 'light');
    root.dataset.wikiText = text;
    root.dataset.wikiWidth = width;
    const theme = color === 'automatic' ? (media.matches ? 'dark' : 'light') : color;
    root.setAttribute('saved-theme', theme);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    for (const [name, value] of [['wiki-text', text], ['wiki-width', width], ['wiki-color', color]]) {
      document.querySelectorAll(`input[name="${name}"]`).forEach(input => input.checked = input.value === value);
    }
  }
  document.addEventListener('change', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !['wiki-text','wiki-width','wiki-color'].includes(input.name)) return;
    try { localStorage.setItem(input.name, input.value); } catch {}
    apply();
  });
  let query = '';
  function closeSearch() {
    document.querySelectorAll('.wiki-search .search-container.active').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.wiki-search .search-bar').forEach(input => input.setAttribute('aria-expanded', 'false'));
  }
  function openSearch(input) {
    const search = input.closest('.search');
    const panel = search?.querySelector('.search-container');
    if (!panel) return;
    panel.classList.toggle('active', !!input.value.trim());
    input.setAttribute('aria-expanded', String(!!input.value.trim()));
  }
  function inlineSearch() {
    document.querySelectorAll('.wiki-search .search').forEach(search => {
      const input = search.querySelector('.search-bar');
      const button = search.querySelector('.search-button');
      if (!input || !button || input.parentElement === search) return;
      button.hidden = true;
      button.tabIndex = -1;
      search.insertBefore(input, button);
      input.placeholder = 'Search';
      input.setAttribute('aria-label', 'Search');
      input.setAttribute('aria-expanded', 'false');
      input.value = query;
      // Search installs its handlers after indexing. Replay input typed during that wait.
      const ready = () => {
        if (!search.querySelector('.tag-suggestions')) return false;
        requestAnimationFrame(() => { if (input.isConnected && input.value.trim()) input.dispatchEvent(new Event('input', { bubbles: true })); });
        return true;
      };
      if (!ready()) {
        const observer = new MutationObserver(() => { if (ready()) observer.disconnect(); });
        observer.observe(search, { childList: true, subtree: true });
        document.addEventListener('prenav', () => observer.disconnect(), { once: true });
      }
    });
    document.querySelectorAll('.toc-header h3').forEach(title => title.textContent = 'Contents');
  }
  document.addEventListener('input', event => {
    if (!event.target.matches?.('.wiki-search .search-bar')) return;
    query = event.target.value;
    openSearch(event.target);
  }, true);
  document.addEventListener('focusin', event => {
    if (!event.target.matches?.('.wiki-search .search-bar')) return;
    openSearch(event.target);
    event.target.dispatchEvent(new Event('input', { bubbles: true }));
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest?.('.wiki-search')) closeSearch();
  });
  document.addEventListener('keydown', event => {
    const input = document.querySelector('.wiki-search .search-bar');
    if (!input) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); event.stopImmediatePropagation(); input.focus(); openSearch(input);
    } else if (event.key === 'Escape' && document.querySelector('.wiki-search .search-container.active')) {
      event.preventDefault(); event.stopImmediatePropagation(); closeSearch();
    }
  }, true);
  document.addEventListener('nav', inlineSearch);
  document.addEventListener('DOMContentLoaded', inlineSearch);
  inlineSearch();
  media.addEventListener('change', apply);
  document.addEventListener('nav', apply);
  document.addEventListener('DOMContentLoaded', apply);
  apply();
})();
