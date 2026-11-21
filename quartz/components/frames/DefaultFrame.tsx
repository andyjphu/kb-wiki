import { PageFrame, PageFrameProps } from "./types"
import { pathToRoot } from "../../util/path"

export const DefaultFrame: PageFrame = {
  name: "default",
  render({ componentData, header, beforeBody, pageBody: Content, afterBody, left, right }: PageFrameProps) {
    const home = componentData.fileData.slug === 'index'
    const editable = componentData.fileData.filePath?.endsWith('.md')
    const root = pathToRoot(componentData.fileData.slug!)
    return <>
      <header class="wiki-masthead">
        <a class="wiki-brand" href={`${root}/`}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 11C17 6 8 7 4 9v29c7-3 14-2 20 2 6-4 13-5 20-2V9c-4-2-13-3-20 2Zm0 0v29M10 15c3-1 6 0 9 1m-9 7c3-1 6 0 9 1m10-8c3-1 6-2 9-1m-9 9c3-1 6-2 9-1"/></svg>
          <span><span class="wiki-wordmark">Boid Knowledge</span></span>
        </a>
        <div class="wiki-search">{header.map(C => <C {...componentData}/>)}</div>
      </header>
      {!home && <aside class="left sidebar wiki-navigation" aria-label="Document contents">
        {left.map(C => <C {...componentData}/>)}
      </aside>}
      <main class={`center wiki-main${home ? " wiki-home-main" : ""}`} id="wiki-main">
        {home ? <div class="wiki-home-layout">
          <section class="wiki-home-files" data-directory data-files={`${root}/static/wiki-files.json`} data-browser={`${root}/`} aria-label="File tree">
            <div class="page-header"><h1 class="article-title"></h1></div>
            <nav class="wiki-path" aria-label="Folder path" />
            <p class="wiki-tree-hint">Shift-click a folder to expand all.</p>
            <div class="wiki-directory-tree"></div>
          </section>
          <section class="wiki-file-preview" aria-label="Page preview"><div class="wiki-file-preview-empty">Select a file to preview.</div></section>
          <template class="wiki-home-source"><Content {...componentData}/></template>
        </div> : <>
        <div class="page-header"><div class="popover-hint">{beforeBody.map(C => <C {...componentData}/>)}</div>
          {editable && <button class="wiki-edit" aria-label="Edit article" data-slug={componentData.fileData.slug} data-api={`${root}/api/document`} data-source={`${root}/source/${componentData.fileData.slug}.md`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m16 3 5 5M3 21l5-1L21 7a2 2 0 0 0-5-5L3 15Z"/></svg></button>}
        </div>
        {editable && <nav class="wiki-path" aria-label="File path" data-slug={componentData.fileData.slug} data-files={`${root}/static/wiki-files.json`} data-browser={`${root}/`} />}
        <Content {...componentData}/>
        <div class="page-footer">{afterBody.map(C => <C {...componentData}/>)}</div>
        </> }
      </main>
      {!home && <aside class="right sidebar wiki-appearance" aria-label="Backlinks">
        {right.map(C => <C {...componentData}/>)}
      </aside>}
    </>
  }
}
