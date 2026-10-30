# Cardbound

A dark co-op RPG deckbuilder: Slay the Spire style card combat, Diablo style gear, and a walkable town hub.

## Play

The live game is the `public/` folder (one page, `public/index.html`), deployed by Cloudflare Pages.
Progress saves in the browser for now; accounts and online co-op come next (Supabase).

## Layout

| Folder | What it holds |
|---|---|
| `public/` | The built game that gets deployed. Do not edit by hand: run `node build.js`. |
| `src/` | Game source. `engine.js` combat rules, `run.js` map runs and parties, `hub.js` saves, gear and cards, `template.html` all screens (town, map, fights), `data.js` enemies and gear tables, `frames.js` and `art.js` card images. |
| `tools/` | Balance simulations that play the game automatically (`node tools/runsim.js 100 White 0`, `node tools/partysim.js 30`, `node tools/progsim.js 25 4`). |
| `design/` | Design workbooks (card database, gear system, Map 1, card art catalog), card frames and approved card art, and the Python scripts that build the workbooks. |

## Build

```
node build.js
```

Requires Node.js 18 or newer. No packages to install.
