# kb-wiki v1

A local Markdown knowledge-base browser, forked from [Quartz](https://github.com/jackyzha0/quartz).

The main page combines a collapsible file tree and a bordered article preview. Folders start collapsed; incoming path links expand the selected branch and highlight its target. Selecting a file previews it, with an explicit link to open the article in a new tab. Articles have same-document contents, clickable filesystem paths, inline search with previews, and a pen button for editing the original Markdown. Saving checks for intervening edits, writes the file, and refreshes the rendered article.

## Boid integration

Boid includes this repository as the `kb-wiki` Git submodule and serves it behind its existing authentication at `/wiki/`. Set `KB_ADDR` to the knowledge-base directory. Boid starts `watch-wiki.mjs` with `WIKI_OUTPUT_ROOT` pointing at its derived wiki state directory. Install Node.js 22+ and run `npm ci` in the submodule before starting Boid.

Build generations are separate from the source Markdown and published through an atomic `current` symlink. One previous generation remains available for requests already resolving files. A KB without `index.md` receives a generated home page without changing its source directory. The original `README.md` remains an article. Malformed YAML metadata is rendered as text in the derived build; original files are not repaired or rewritten. Absolute Markdown links within `KB_ADDR` resolve to wiki articles.

The editor uses authenticated `GET`/`PUT /wiki/api/document?slug=...` endpoints supplied by Boid. This renderer does not store login credentials. Source Markdown, generated HTML, file paths and search indexes are private and must remain behind Boid authentication.

## Local preview

```sh
npm ci
node build-wiki.mjs
node preview-server.mjs
```

Open `http://localhost:8788/wiki/`. The bundled `content/` directory contains illustrative notes, not a copy of a production KB. Set `KB_ADDR` before both commands to use another directory. The preview binds only to loopback; it is a development server, not Boid's authenticated production endpoint.

## Licenses

Quartz and this fork use MIT. The locally bundled D3 7.9.0 build is ISC-licensed; its notice is retained at `quartz/static/vendor/d3-LICENSE`. No CDN is required for the graph.
